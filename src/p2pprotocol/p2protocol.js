const dns = require('dns');
const { URL } = require('url');
const { promisify } = require('util');
const P2PProtocolStore = require('./store');
const {
  messageTypes, messageValidators, fetchPeers, returnPeers
} = require('./messages');
const { pickItems } = require('../utils/common');

// look up dns records
const lookup = promisify(dns.lookup);

if (BUILD_TARGET === 'node') {
  // running in node

  var EventEmitter = require('events');

} else {
  // running in browser

  var EventEmitter = require('wolfy87-eventemitter');
}

/**
 * A abstract peer-to-peer protocol. You should NOT bind this protocol directly to 
 * an implementation of node client. Instead, you should extend this protocol.
 * 
 * NOTE all subclass implementations MUST emit a `ready` event (a protocol is also
 * an event emitter).
 */
class P2PProtocol extends EventEmitter {
  /**
   * @param {*} node      full node, thin node, or...
   * @param {*} nodeTypes node types to which a node will try to establish connection
   *                      automatically. For instance, you want to maintain connected
   *                      `full` nodes at least with a specific number, but you don't
   *                      care how many `thin` nodes are connected. So you should only
   *                      give `full` here, instead of both.
   */
  constructor(node, nodeTypes, { minPeerNum = 8 } = {}) {
    super();

    if (new.target === P2PProtocol) {
      throw new TypeError("Cannot construct P2PProtocol instances directly");
    }

    this.persistPeerUrls = this.persistPeerUrls.bind(this);
    this.fetchPeersHandler = this.fetchPeersHandler.bind(this);
    this.returnPeersHandler = this.returnPeersHandler.bind(this);

    this.node = node;
    this.litenode = node.litenode;
    this.nodeTypes = nodeTypes;
    this.minPeerNum = minPeerNum;
    this.intervalTimers = [];
    this.store = new P2PProtocolStore(node.db);

    // register message handlers
    this.litenode.on(`message/${messageTypes['fetchPeers']}`, this.fetchPeersHandler);
    this.litenode.on(`message/${messageTypes['returnPeers']}`, this.returnPeersHandler);

    this.connectToLastConnectedPeers();

    // periodically fetch more peers of given node types
    this.intervalTimers.push(
      setInterval(() => {
        if (this.node.peers(nodeTypes).length < minPeerNum) {
          this.litenode.broadcastJson(fetchPeers({ nodeTypes }));
        }
      }, 60000)
    );

    // periodically persist peer urls
    this.intervalTimers.push(
      setInterval(this.persistPeerUrls, 120000)
    );
  }

  async connectToLastConnectedPeers() {
    try {
      let initUrls = this.node.initPeerUrls;
      // initial peer urls can be hostnames, so perform dns queries first
      let addresses = await Promise.all(
        initUrls.map(url => lookup(new URL(url).hostname, { family: 4 }))
      );

      initUrls = initUrls.map((url, i) => {
        url = new URL(url);
        url.hostname = addresses[i].address
        return url.toString().replace(/\/$/, '');
      });

      (await this.store.readCurPeerUrls())
        .filter(url => !initUrls.includes(url))
        .forEach(url => this.litenode.createConnection(url));

    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  }

  async persistPeerUrls() {
    try {
      let peerUrls = this.node.peers(this.nodeTypes)
        .map(peer => peer.url);
      await this.store.writeCurPeerUrls(peerUrls);
    } catch (err) {
      console.error(err);
    }
  }

  fetchPeersHandler({ messageType, ...payload }, peer) {
    try {
      // validate the received message
      messageValidators[messageType](payload);
      
      let { nodeTypes, limit } = payload;
      let connectedPeerUrls = this.node.peers(nodeTypes)
        .map(peer => peer.url);
      if (connectedPeerUrls.includes(peer.url)) {
        connectedPeerUrls.splice(connectedPeerUrls.indexOf(peer.url), 1);
      }
      let peerUrls = pickItems(connectedPeerUrls, limit);
      let resMsg = returnPeers({ nodeTypes, peerUrls });
      peer.sendJson(resMsg);
    } catch (err) {
      console.warn(err);
    }
  }

  returnPeersHandler({ messageType, ...payload }, peer) {
    try {
      // validate the received message
      messageValidators[messageType](payload);
      
      let { nodeTypes, peerUrls } = payload;
      let connectedPeerUrls = this.node.peers(nodeTypes)
        .map(peer => peer.url);
      peerUrls.filter(url => !connectedPeerUrls.includes(url))
        .forEach(url => this.litenode.createConnection(url));
    } catch (err) {
      console.warn(err);
    }
  }

  close() {
    this.intervalTimers.forEach(t => clearInterval(t));
  }
}

module.exports = P2PProtocol;
const P2PProtocolStore = require('./store');
const {
  messageTypes, messageValidators, fetchPeers, returnPeers
} = require('./messages');
const { pickItems } = require('../utils/common');

/**
 * A abstract peer-to-peer protocol. You should NOT bind this protocol directly to 
 * an implementation of node client. Instead, you should extend this protocol.
 */
class P2PProtocol {
  /**
   * @param {*} node      full node, thin node, or...
   * @param {*} nodeTypes node types to which a node will try to establish connection
   */
  constructor(node, nodeTypes, { minPeerNum = 8 } = {}) {
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
      }, 5000)
    );

    // periodically persist peer urls
    this.intervalTimers.push(
      setInterval(this.persistPeerUrls, 60000)
    );
  }

  async connectToLastConnectedPeers() {
    try {
      let peerUrls = await this.store.readCurPeerUrls();
      peerUrls.forEach(url => this.litenode.createConnection(url));
    } catch (err) {
      console.error(err);
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

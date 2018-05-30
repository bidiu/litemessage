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
  constructor(node, nodeTypes, { minPeerNum = 30 } = {}) {
    this.fetchPeersHandler = this.fetchPeersHandler.bind(this);
    this.returnPeersHandler = this.returnPeersHandler.bind(this);

    this.node = node;
    this.litenode = node.litenode;
    this.db = node.db;
    this.nodeTypes = nodeTypes;
    this.minPeerNum = minPeerNum;
    this.intervalTimers = [];

    // register message handlers
    this.litenode.on(`message/${messageTypes['fetchPeers']}`, this.fetchPeersHandler);
    this.litenode.on(`message/${messageTypes['returnPeers']}`, this.returnPeersHandler);

    this.intervalTimers.push(
      // periodically fetch more peers of given node types
      setInterval(() => {
        if (this.node.peers(nodeTypes).length < minPeerNum) {
          this.litenode.broadcastJson(fetchPeers({ nodeTypes }));
        }
      }, 5000)
    );
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

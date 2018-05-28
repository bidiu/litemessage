const LiteNode = require('./litenode');

const nodeType = 'full';

/**
 * The Litemessage fully functional node client.
 * 
 * TODO abort unknown node type at low level
 * TODO several leveldb store, or just one
 * TODO bind to different interfaces
 */
class FullNode {
  constructor({ port, initPeerUrls = [] } = {}) {
    this.litenode = new LiteNode(nodeType, { port: port + '' });
    // connect to initial peers
    initPeerUrls.forEach(url => this.litenode.createConnection(url))

    this.timer = setInterval(() => {
      console.log(`Right now, there are ${this.peers.length} connected peers.`);
    }, 60000);
  }

  get peers() {
    let peers = this.litenode ? Object.values(this.litenode.peers) : [];
    return peers.filter(peer => peer.nodeType === nodeType);
  }

  close(callback) {
    clearInterval(this.timer);
    this.litenode.close(callback);
  }
}

module.exports = FullNode;

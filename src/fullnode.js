const LiteNode = require('./litenode');

const nodeTypes = ['full', 'thin'];
const nodeType = 'full';

/**
 * The Litemessage fully functional node client.
 * 
 * TODO fails to bind should crash the client imediately
 * TODO a base node class
 * TODO abort unknown node type at low level (`validNodeTypes`)
 * TODO several leveldb store, or just one
 * TODO bind to different interfaces
 */
class FullNode {
  /**
   * Note `port` here must be number (instead of string).
   */
  constructor(protocolClass, { port, initPeerUrls = [] } = {}) {
    port = typeof port === 'number' ? (port + '') : undefined;
    // create underlying litenode
    this.litenode = new LiteNode(nodeType, { port });
    // load protocol
    this.protocol = new protocolClass(this, null, nodeTypes);
    // connect to initial peers
    initPeerUrls.forEach(url => this.litenode.createConnection(url));

    this.timer = setInterval(() => {
      console.log(`Right now, there are ${this.peers().length} connected peers (full & thin).`);
      // this.debugInfo();
    }, 20000);
  }

  static get nodeType() {
    return nodeType;
  }

  /**
   * @param {string|Array<string>} nodeType the node types (pass `*` for matching all types)
   */
  peers(nodeTypes = '*') {
    if (typeof nodeTypes === 'string' && nodeTypes !== '*') {
      nodeTypes = [nodeTypes];
    }

    let peers = this.litenode ? Object.values(this.litenode.peers) : [];
    return peers.filter(peer => nodeTypes === '*' || nodeTypes.includes(peer.nodeType));
  }

  close(callback) {
    clearInterval(this.timer);
    this.litenode.close(callback);
  }

  debugInfo() {
    console.log('<<<<< debug start >>>>>');
    let peerUrls = this.peers().map(peer => peer.url);
    console.log(peerUrls);
    console.log('<<<<<< debug end >>>>>>');
  }
}

module.exports = FullNode;

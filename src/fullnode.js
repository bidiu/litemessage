const fs = require('fs');
const uuidv1 = require('uuid/v1');
const leveldown = require('leveldown');
const levelup = require('levelup');
const LiteNode = require('./litenode');
const LiteProtocol = require('./liteprotocol/liteprotocol');

/**
 * The Litemessage fully functional node client.
 * 
 * TODO a base node class (also simplify the api, moving to litenode?)
 * TODO copy `peers` method to `litenode`, and abstract node class
 * TODO fails to bind should crash the client imediately
 */
class FullNode {
  /**
   * Note `port` here must be number (instead of string).
   */
  constructor(dbPath, { protocolClass = LiteProtocol, initPeerUrls = [], port } = {}) {
    this.uuid = uuidv1();
    this.nodeType = FullNode.nodeType;
    this.initPeerUrls = [...initPeerUrls];

    // initialize the database (Level DB)
    if (fs.existsSync(dbPath) && fs.statSync(dbPath).isDirectory()) {
      console.log('Using existing LevelDB directory.');
    } else {
      console.log('A new LevelDB directory will be created.');
    }
    this.db = levelup(leveldown(dbPath));

    // create underlying litenode
    this.litenode = new LiteNode(this.uuid, { port });
    // create protocol manager
    this.protocol = new protocolClass(this);

    this.timer = setInterval(() => {
      console.log(`Right now, there are ${this.peers().length} connected peers (full & thin).`);
      // TODO this.debugInfo();
    }, 20000);

    this.protocol.on('ready', () => {
      // connect to initial peers
      this.initPeerUrls.forEach(url => this.litenode.createConnection(url));
    });
  }

  static get nodeType() {
    return 'full';
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

  close() {
    clearInterval(this.timer);
    this.protocol.close();
    this.litenode.close();
    this.db.close();
  }

  // TODO
  debugInfo() {
    console.log('<<<<< debug start >>>>>');
    let peerUrls = this.peers().map(peer => peer.url);
    console.log(peerUrls);
    console.log('<<<<<< debug end >>>>>>');
  }
}

module.exports = FullNode;

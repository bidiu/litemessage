const fs = require('fs');
const leveldown = require('leveldown');
const levelup = require('levelup');
const LiteNode = require('./litenode');

const nodeTypes = ['full', 'thin'];
const nodeType = 'full';

/**
 * The Litemessage fully functional node client.
 * 
 * TODO protocolClass should has a default value
 * TODO port number/string
 * TODO a base node class (also simplify the api, moving to litenode?)
 * TODO fails to bind should crash the client imediately
 */
class FullNode {
  /**
   * Note `port` here must be number (instead of string).
   */
  constructor(protocolClass, dbPath, { port = 1113, initPeerUrls = [] } = {}) {
    this.port = port;
    // TODO port = typeof port === 'number' ? (port + '') : undefined;
    this.initPeerUrls = [...initPeerUrls];
    // initialize the db (level db)
    this.initDb(dbPath);
    // create underlying litenode
    this.litenode = new LiteNode(nodeType, { port });
    // load protocol
    this.protocol = new protocolClass(this, nodeTypes);

    this.timer = setInterval(() => {
      console.log(`Right now, there are ${this.peers().length} connected peers (full & thin).`);
      // this.debugInfo();
    }, 20000);

    this.protocol.on('ready', () => {
      // connect to initial peers
      initPeerUrls.forEach(url => this.litenode.createConnection(url));
    });
  }

  static get nodeType() {
    return nodeType;
  }

  initDb(dbPath) {
    if (fs.existsSync(dbPath) && fs.statSync(dbPath).isDirectory()) {
      console.log('Using existing LevelDB directory.');
    } else {
      console.log('A new LevelDB directory will be created.');
    }
    this.db = levelup(leveldown(dbPath));
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

  debugInfo() {
    console.log('<<<<< debug start >>>>>');
    let peerUrls = this.peers().map(peer => peer.url);
    console.log(peerUrls);
    console.log('<<<<<< debug end >>>>>>');
  }
}

module.exports = FullNode;

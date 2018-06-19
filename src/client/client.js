const fs = require('fs');
const leveldown = require('leveldown');
const levelup = require('levelup');
const LiteNode = require('../litenode');

const nodeTypes = ['full', 'thin'];
const nodeType = 'thin';

class ThinClient {
  constructor(protocolClass, dbPath, { port = 1113, initPeerUrls = [] } = {}) {
    this.port = port;
    port = typeof port === 'number' ? (port + '') : undefined;
    this.initPeerUrls = [...initPeerUrls];

    // initialize the db (level db)
    this.initDb(dbPath);

    // create underlying litenode
    this.litenode = new LiteNode(nodeType, { port });

    // load protocol
    this.protocol = new protocolClass(this, nodeTypes);

    // connect to initial peers
    initPeerUrls.forEach(url => this.litenode.createConnection(url));

    this.timer = setInterval(() => {
      console.log(`Right now, there are ${this.peers().length} connected peers (full & thin).`);
    }, 20000);
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
}

module.exports = ThinClient;

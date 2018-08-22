const fs = require('fs');
const uuidv1 = require('uuid/v1');
const leveldown = require('leveldown');
const levelup = require('levelup');
const LiteNode = require('../litenode');

/**
 * A UUID identifying this node will be automatically generated.
 */
class Node {
  constructor(nodeType, dbPath, port, protocolClass, initPeerUrls) {
    if (new.target === Node) {
      throw new TypeError("Cannot construct Node instances directly.");
    }

    // some necessary info
    this.uuid = uuidv1();
    this.nodeType = nodeType;
    this.initPeerUrls = initPeerUrls;

    // initialize the database (Level DB)
    if (fs.existsSync(dbPath) && fs.statSync(dbPath).isDirectory()) {
      console.log('Using existing LevelDB directory.');
    } else {
      console.log('A new LevelDB directory will be created.');
    }
    this.db = levelup(leveldown(dbPath));

    // create underlying litenode
    this.litenode = new LiteNode(this.uuid, { port });
    // instantiate the protocol manager
    this.protocol = new protocolClass(this);

    this.protocol.on('ready', () => {
      // connect to initial peers
      this.initPeerUrls.forEach(url => this.litenode.createConnection(url));
    });
  }

  /**
   * @param {string|Array<string>} nodeTypes pass `*` for matching all types
   */
  peers(nodeTypes = '*') {
    if (typeof nodeTypes === 'string' && nodeTypes !== '*') {
      nodeTypes = [nodeTypes];
    }

    let peers = this.litenode ? Object.values(this.litenode.peers) : [];
    return peers.filter(peer => nodeTypes === '*' || nodeTypes.includes(peer.nodeType));
  }

  /**
   * Do the cleanup.
   */
  close() {
    this.protocol.close();
    this.litenode.close();
    this.db.close();
  }
}

module.exports = Node;

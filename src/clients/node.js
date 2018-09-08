const uuidv1 = require('uuid/v1');
const levelup = require('levelup');
const LiteNode = require('../litenode');

if (BUILD_TARGET === 'node') {
  // run in node

  var fs = require('fs');
  var leveldb = require('leveldown');
  var EventEmitter = require('events');

} else {
  // run in browser

  var leveldb = require('level-js');
  var EventEmitter = require('wolfy87-eventemitter');
}

/**
 * A UUID identifying this node will be automatically generated.
 * 
 * TODO provide implementation in browser env examining existing db
 */
class Node extends EventEmitter {
  constructor(nodeType, dbPath, port, protocolClass, initPeerUrls, debug, noserver) {
    if (new.target === Node) {
      throw new TypeError("Cannot construct Node instances directly.");
    }

    super();

    // some necessary info
    this.uuid = uuidv1();
    this.nodeType = nodeType;
    this.initPeerUrls = initPeerUrls;

    if (BUILD_TARGET === 'node') {
      if (fs.existsSync(dbPath) && fs.statSync(dbPath).isDirectory()) {
        console.log('Using existing LevelDB directory.');
      } else {
        console.log('A new LevelDB directory will be created.');
      }
    }

    // initialize the database (Level DB)
    this.db = levelup(leveldb(dbPath));

    // create underlying litenode
    this.litenode = new LiteNode(this.uuid, { port, debug, noserver });
    // instantiate the protocol manager
    this.protocol = new protocolClass(this);

    this.protocol.on('ready', () => {
      // connect to initial peers
      this.initPeerUrls.forEach(url => this.litenode.createConnection(url));
      this.emit('ready');
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

/*! v0.4.2-1-g35e7425 */
module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 14);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

if (true) {
  // node

  var path = __webpack_require__(10);
  var crypto = __webpack_require__(31);
  var { fork } = __webpack_require__(32);
  var Promise = __webpack_require__(33);
  var Buffer = __webpack_require__(34).Buffer;

  Promise.config({
    // enable warnings
    warnings: true,
    // enable long stack traces
    longStackTraces: true,
    //enable cancellation
    cancellation: true
  });

} else { var Buffer, sha256; }

// ********************* requiring ends *********************

const maskTable = Object.freeze([
  0x80, 
  0x40, 
  0x20,
  0x10,
  0x08,
  0x04,
  0x02,
  0x01
]);

if (true) {
  // node

  var sha256 = (content, digest = 'hex') => 
    crypto.createHash('sha256')
      .update(content)
      .digest(digest);

  var mine = (content, difficulty) => 
    new Promise((resolve, reject, onCancel) => {
      if (typeof difficulty !== 'number') { reject(new Error('Invalid difficulty.')); }
      let cp = fork(path.join(__dirname, 'mine.js'), [content, difficulty]);
  
      let timer = setTimeout(() => {
        cp.removeAllListeners();
        cp.kill('SIGTERM');
        reject(new Error('Mining timeouts.'));
  
        // disable timeout in production
      }, 600000);
  
      cp.on('message', (nonce) => {
        clearTimeout(timer);
        resolve(nonce);
      });
      
      onCancel(() => {
        clearTimeout(timer);
        cp.removeAllListeners();
        cp.kill('SIGTERM');
      });
    });

} else {}

/**
 * @param {Array<string>} leaves  list of litemessage ids
 */
const calcMerkleRoot = (leaves) => {
  if (leaves.length === 0) {
    throw new Error('Cannot calcuate merkle root from 0 leaf.');
  }
  if (leaves.length % 2 === 1) {
    leaves = [...leaves, leaves[leaves.length - 1]]
  }
  let innerNodes = [];
  for (let i = 0; i < leaves.length; i += 2) {
    innerNodes.push(sha256(`${leaves[i]}${leaves[i + 1]}`));
  }
  if (innerNodes.length === 1) {
    return innerNodes[0];
  }
  return calcMerkleRoot(innerNodes);
}

/**
 * If verification passes, `true` will be returned.
 */
const verifyMerkleRoot = (merkleRoot, leaves) => {
  return merkleRoot === calcMerkleRoot(leaves);
}

/**
 * @param {Buffer|string} buffer binary buffer or string in hex encoding
 */
const leadingZeroBits = (buffer) => {
  if (typeof buffer === 'string') {
    buffer = Buffer.from(buffer, 'hex');
  }
  let bits = 0;
  let byteAt = 0;

  for (; buffer[byteAt] === 0; byteAt++) {
    bits += 8;
  }
  for (let bitAt = 0; bitAt < 8; bitAt++) {
    if (buffer[byteAt] & maskTable[bitAt]) {
      break;
    }
    bits += 1;
  }

  return bits;
}

/**
 * TODO validate timestamp, sig, pubKey
 * For timestamp, need to consider how long it takes to
 * populate the network.
 */
const verifyLitemsg = (litemessage) => {
  if (!litemessage) { return false; }

  let { ver, time, litemsg, sig, pubKey, hash } = litemessage;

  if (typeof ver !== 'number') {
    return false;
  }
  if (typeof time !== 'number') {
    return false;
  }
  if (typeof litemsg !== 'string') {
    return false;
  }
  if (hash !== sha256(`${ver}${time}${litemsg}${sig}${pubKey}`)) {
    return false;
  }
  return true;
};

/**
 * TODO validate timestamp, bits (its value)
 * 
 * Note that if you don't pass `prevBlock`, this func won't verify `height` (though
 * it still must be a positive number) and `prevBlock` (though it still must be 
 * `undefined` when `height` is 0).
 * 
 * When verifying genesis block (the first block), you shouldn't pass `prevBlock`
 * parameter.
 * 
 * @param {*} block     the block to verify
 * @param {*} prevBlock (optional) previous block (not id), which the verified
 *                      block should be after immediately
 */
const verifyBlock = (block, prevBlock) => {
  if (!block) { return false; }

  let { ver, time, height, merkleRoot, bits, nonce, litemsgs } = block;

  if (typeof ver !== 'number') {
    return false;
  }
  if (typeof time !== 'number') {
    return false;
  }
  if (typeof height !== 'number' || height < 0 || 
    (height === 0 && typeof block.prevBlock !== 'undefined') ||
    (height !== 0 && typeof block.prevBlock === 'undefined')) {

    return false;
  }
  if (!(litemsgs instanceof Array) || !litemsgs.length) {
    return false;
  }
  if (typeof merkleRoot !== 'string' || !verifyMerkleRoot(merkleRoot, litemsgs.map(m => m.hash))) {
    return false;
  }
  
  /* bits, nonce, hash */
  if (typeof bits !== 'number'|| typeof nonce !== 'number'
    || nonce < 0 || typeof block.hash !== 'string') {
    
    return false;
  }
  let hash = sha256(`${ver}${time}${height}${block.prevBlock}${merkleRoot}${bits}${nonce}`);
  if (hash !== block.hash || leadingZeroBits(hash) < bits) {
    return false;
  }

  /* litemsgs */
  for (let litemsg of litemsgs) {
    if (!verifyLitemsg(litemsg)) { return false; }
  }

  /* height, prevBlock */
  if (typeof prevBlock !== 'undefined') {
    if (typeof block.prevBlock !== 'string' || prevBlock.hash !== block.prevBlock) {
      return false;
    }

    if (prevBlock.height + 1 !== height) { return false; }
  }
  return true;
};

/**
 * Note that `subchain` start from elder blocks to newer blocks, which is a
 * block array.
 * 
 * Parameter `prevBlock` should always be a valid block (NEVER pass un-verified
 * blocks received from peers). Or when the subchain starts at genesis block, 
 * do not pass parameter `prevBlock` (leave it as `undefined`).
 */
const verifySubchain = (subchain, prevBlock) => {
  for (let block of subchain) {
    if (!verifyBlock(block, prevBlock)) {
      return false;
    }
    prevBlock = block;
  }
  return true;
};

exports.sha256 = sha256;
exports.calcMerkleRoot = calcMerkleRoot;
exports.verifyMerkleRoot = verifyMerkleRoot;
exports.leadingZeroBits = leadingZeroBits;
exports.verifyLitemsg = verifyLitemsg;
exports.verifyBlock = verifyBlock;
exports.verifySubchain = verifySubchain;

if (true) {
  // node

  exports.mine = mine;

} else {}


/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("events");

/***/ }),
/* 2 */
/***/ (function(module, exports) {

/**
 * in ms
 */
const getCurTimestamp = (unit = 'ms') => {
  if (unit === 'ms') {
    return new Date().getTime();
  } else if (unit === 's') {
    return Math.round(new Date().getTime() / 1000);
  } else {
    throw new Error('Invalid unit: ' + unit + '.');
  }
}

exports.getCurTimestamp = getCurTimestamp;


/***/ }),
/* 3 */
/***/ (function(module, exports) {

const getRemoteAddress = (socket) => {
  return socket._socket.remoteAddress.replace(/^.*:/, '');
};

/**
 * Note that a string will be returned.
 */
const getRemotePort = (socket) => {
  return socket._socket.remotePort + '';
};

/**
 * Of remote end.
 * 
 * @param {*} socket 
 */
const getSocketAddress = (socket) => {
  return `${getRemoteAddress(socket)}:${getRemotePort(socket)}`;
};

const getLocalAddress = (socket) => 
  socket._socket.localAddress.replace(/^.*:/, '');

const getLocalPort = (socket) => 
  socket._socket.localPort;

const getLocalSocketAddr = (socket) =>
  `${getLocalAddress(socket)}:${getLocalPort(socket)}`;

const getSocketInfo = (socket) => ({
  localSocketAddr: getLocalSocketAddr(socket),
  remoteSocketAddr: getSocketAddress(socket)
});

exports.getRemoteAddress = getRemoteAddress;
exports.getRemotePort = getRemotePort;
exports.getSocketAddress = getSocketAddress;
exports.getLocalAddress = getLocalAddress;
exports.getLocalPort = getLocalPort;
exports.getLocalSocketAddr = getLocalSocketAddr;
exports.getSocketInfo = getSocketInfo;


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

const path = __webpack_require__(10);

const isValidJson = (json) => {
  if (typeof json !== 'string' || !json) {
    return false;
  }

  try {
    JSON.parse(json);
    return true;
  } catch (e) { }
  return false;
};

/**
 * project's root path, of course this file cannot be moved around
 */
const getAbsRootPath = () => {
  return path.join(__dirname, '../..');
};

/**
 * From 0 (inclusive) to `max` (exclusive).
 */
const randomInt = (max) => {
  return Math.floor(Math.random() * Math.floor(max));
};

/**
 * Randomly pick `num` items from an array. Note that original array 
 * won't be altered. And also the order of items won't be preserved 
 * in the picked array.
 */
const pickItems = (array, num) => {
  let copiedArray = [...array];
  let picked = [];
  num = Math.min(array.length, num);
  for (let i = 0; i < num; i++) {
    picked.push(...copiedArray.splice(randomInt(copiedArray.length), 1));
  }
  return picked;
};

const sliceItems = (array, slices) => {
  slices = Math.max( Math.min(array.length, slices), 1 );

  let l = Math.floor(array.length / slices);
  let sliced = [];

  for (let i = 0; i < slices; i++) {
    if (i + 1 === slices) {
      sliced.push( array.slice(l * i) );
    } else {
      sliced.push( array.slice(l * i, l * (i + 1)) );
    }
  }
  return sliced;
};

const parseChunk = (buffer) => {
  if (buffer.length % 32) { throw new Error('Invalid chunk buffer.'); }

  let hashes = [];
  for (let i = 0; i < buffer.length; i += 32) {
    hashes.push(buffer.slice(i, i + 32).toString('hex'));
  }
  return hashes;
};

exports.isValidJson = isValidJson;
exports.getAbsRootPath = getAbsRootPath;
exports.randomInt = randomInt;
exports.pickItems = pickItems;
exports.sliceItems = sliceItems;
exports.parseChunk = parseChunk;


/***/ }),
/* 5 */
/***/ (function(module, exports) {

const messageTypes = Object.freeze({
  info: 'lite/info',
  infoAck: 'lite/info_ack',

  getBlocks: 'lite/get_blocks',
  inv: 'lite/inv',
  getData: 'lite/get_data',
  data: 'lite/data',
  getDataPartial: 'lite/get_data_partial',
  dataPartial: 'lite/data_partial',
  partialNotFound: 'lite/partial_not_found',

  getPendingMsgs: 'lite/get_pending_msgs',

  getHeaders: 'lite/get_headers',
  headers: 'lite/headers'
});

const info = ({ uuid, nodeType, daemonPort }) => ({
  messageType: messageTypes.info,
  uuid,
  nodeType,
  daemonPort
});

info.validate = ({ uuid, nodeType, daemonPort }) => {
  if (typeof uuid !== 'string') {
    throw new Error('lite/: Invalid uuid.');
  }
  if (nodeType !== 'full' && nodeType !== 'thin') {
    throw new Error('lite/: Invalid node type.');
  }
  if (daemonPort !== undefined && (typeof daemonPort !== 'number' 
      || daemonPort <= 1024)) {
    throw new Error('lite/: Invalid daemon port.');
  }
  if (nodeType === 'uuid' && !daemonPort) {
    throw new Error('lite/: Invalid daemon port.');
  }
};

const infoAck = () => ({
  messageType: messageTypes.infoAck
});

infoAck.validate = () => {
  // nothing here
}

const getBlocks = ({ blockLocators }) => ({
  messageType: messageTypes.getBlocks,
  blockLocators
});

getBlocks.validate = ({ blockLocators }) => {
  if (!(blockLocators instanceof Array)) {
    throw new Error('lite/: Invalid block locators.');
  }
};

/**
 * both params are list of ids
 */
const inv = ({ blocks = [], litemsgs = [] }) => ({
  messageType: messageTypes.inv,
  blocks,
  litemsgs
});

inv.validate = ({ blocks, litemsgs }) => {
  if (!(blocks instanceof Array)) {
    throw new Error('lite/: Invalid blocks.');
  }
  if (!(litemsgs instanceof Array)) {
    throw new Error('lite/: Invalid lite messages.');
  }
};

/**
 * both params are list of ids
 */
const getData = ({ blocks = [], litemsgs = [] }) => ({
  messageType: messageTypes.getData,
  blocks,
  litemsgs
});

getData.validate = ({ blocks, litemsgs }) => {
  if (!(blocks instanceof Array)) {
    throw new Error('lite/: Invalid blocks.');
  }
  if (!(litemsgs instanceof Array)) {
    throw new Error('lite/: Invalid lite messages.');
  }
};

const data = ({ blocks = [], litemsgs = [] }) => ({
  messageType: messageTypes.data,
  blocks,
  litemsgs
});

data.validate = ({ blocks, litemsgs }) => {
  if (!(blocks instanceof Array)) {
    throw new Error('lite/: Invalid blocks.');
  }
  if (!(litemsgs instanceof Array)) {
    throw new Error('lite/: Invalid lite messages.');
  }
};

const getDataPartial = ({ merkleDigest, blocks }) => ({
  messageType: messageTypes.getDataPartial,
  merkleDigest,
  blocks
});

getDataPartial.validate = ({ merkleDigest, blocks }) => {
  if (typeof merkleDigest !== 'string') {
    throw new Error('lite/: Invalid merkle digest.');
  }
  if (!(blocks instanceof Array)) {
    throw new Error('lite/: Invalid blocks.');
  }
};

const dataPartial = ({ merkleDigest, blocks }) => ({
  messageType: messageTypes.dataPartial,
  merkleDigest,
  blocks
});

dataPartial.validate = ({ merkleDigest, blocks }) => {
  if (typeof merkleDigest !== 'string') {
    throw new Error('lite/: Invalid merkle digest.');
  }
  if (!(blocks instanceof Array)) {
    throw new Error('lite/: Invalid blocks.');
  }
};

const partialNotFound = ({ merkleDigest, blocks }) => ({
  messageType: messageTypes.partialNotFound,
  merkleDigest,
  blocks
});

partialNotFound.validate = ({ merkleDigest, blocks }) => {
  if (typeof merkleDigest !== 'string') {
    throw new Error('lite/: Invalid merkle digest.');
  }
  if (!(blocks instanceof Array)) {
    throw new Error('lite/: Invalid blocks.');
  }
};

const getPendingMsgs = () => ({
  messageType: messageTypes.getPendingMsgs
});

getPendingMsgs.validate = () => {
  // nothing
};

// validators
const messageValidators = Object.freeze({
  [messageTypes.info]: info.validate,
  [messageTypes.infoAck]: infoAck.validate,
  [messageTypes.getBlocks]: getBlocks.validate,
  [messageTypes.inv]: inv.validate,
  [messageTypes.getData]: getData.validate,
  [messageTypes.data]: data.validate,
  [messageTypes.getDataPartial]: getDataPartial.validate,
  [messageTypes.dataPartial]: dataPartial.validate,
  [messageTypes.partialNotFound]: partialNotFound.validate,
  [messageTypes.getPendingMsgs]: getPendingMsgs.validate
});

exports.messageTypes = messageTypes;
exports.messageValidators = messageValidators;
exports.info = info;
exports.infoAck = infoAck;
exports.getBlocks = getBlocks;
exports.inv = inv;
exports.getData = getData;
exports.data = data;
exports.getDataPartial = getDataPartial;
exports.dataPartial = dataPartial;
exports.partialNotFound = partialNotFound;
exports.getPendingMsgs = getPendingMsgs;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

const fs = __webpack_require__(15);
const uuidv1 = __webpack_require__(16);
const leveldown = __webpack_require__(17);
const levelup = __webpack_require__(18);
const LiteNode = __webpack_require__(19);

/**
 * A UUID identifying this node will be automatically generated.
 */
class Node {
  constructor(nodeType, dbPath, port, protocolClass, initPeerUrls, debug) {
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
    this.litenode = new LiteNode(this.uuid, { port, debug });
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


/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = require("url");

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

const P2PProtocol = __webpack_require__(9);
const HandshakeManager = __webpack_require__(11);

/**
 * An experimental "thin" litemessage protocol implementation.
 * The "thin" here means this is a light weight implementation,
 * similar to SPV nodes in Bitcoin. Typically, client nodes
 * (such as used by common users with browser or CLI) will use
 * this tpye of implementation.
 * 
 * **NOTE** that this is an experimental implementation, so it
 * probably will be refactored in the future.
 */
class ThinLiteProtocol extends P2PProtocol {
  constructor(node) {
    super(node);

    this.handshake = new HandshakeManager(this);
    setTimeout(() => this.emit('ready'), 0);
  }

  close() {
    this.handshake.close();
    super.close();
  }
}

module.exports = ThinLiteProtocol


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

const dns = __webpack_require__(23);
const { URL } = __webpack_require__(7);
const { promisify } = __webpack_require__(24);
const P2PProtocolStore = __webpack_require__(25);
const {
  messageTypes, messageValidators, fetchPeers, returnPeers
} = __webpack_require__(26);
const { pickItems } = __webpack_require__(4);

// look up dns records
const lookup = promisify(dns.lookup);

if (true) {
  // running in node

  var EventEmitter = __webpack_require__(1);

} else { var EventEmitter; }

/**
 * A abstract peer-to-peer protocol. You should NOT bind this protocol directly to 
 * an implementation of node client. Instead, you should extend this protocol.
 * 
 * NOTE all subclass implementations MUST emit a `ready` event (a protocol is also
 * an event emitter).
 * 
 * NOTE the `nodeTypes` option, which specifies the types of node to connect automatically
 * when connecting to few of these types of node. The threshold is set by `minPeerNum`
 * option. The connected peers will also be persisted. When node is restarted, it will
 * reconnect those peristed peers.
 * 
 * NOTE if you don't explicitly provde `nodeTypes` option, then it won't have any
 * auto-connecting feature as well as the feature of auto peer persistance.
 */
class P2PProtocol extends EventEmitter {
  /**
   * @param {*} node      full node, thin node, or...
   * @param {*} options
   *            nodeTypes nodeTypes node types to which a node will try to establish connection
   *                      automatically. For instance, you want to maintain connected
   *                      `full` nodes at least with a specific number, but you don't
   *                      care how many `thin` nodes are connected. So you should only
   *                      give `full` here, instead of both.
   *           minPeerNum the minimal number of peers of type specified by `nodeTypes`
   */
  constructor(node, { nodeTypes = [], minPeerNum = 8 } = {}) {
    super();

    if (new.target === P2PProtocol) {
      throw new TypeError("Cannot construct P2PProtocol instances directly.");
    }

    this.persistPeerUrls = this.persistPeerUrls.bind(this);
    this.fetchPeersHandler = this.fetchPeersHandler.bind(this);
    this.returnPeersHandler = this.returnPeersHandler.bind(this);

    this.node = node;
    this.litenode = node.litenode;

    this.intervalTimers = [];
    this.store = new P2PProtocolStore(node.db);
    
    this.nodeTypes = nodeTypes;
    this.minPeerNum = minPeerNum;

    // register message handlers
    this.litenode.on(`message/${messageTypes['fetchPeers']}`, this.fetchPeersHandler);
    this.litenode.on(`message/${messageTypes['returnPeers']}`, this.returnPeersHandler);

    if (nodeTypes.length) {
      this.connectToLastConnectedPeers();

      // periodically fetch more peers of given node types
      this.intervalTimers.push(
        setInterval(() => {
          if (this.node.peers(nodeTypes).length < minPeerNum) {
            this.litenode.broadcastJson(fetchPeers({ nodeTypes }));
          }
        }, 40000)
      );

      // periodically persist peer urls
      this.intervalTimers.push(
        setInterval(this.persistPeerUrls, 120000)
      );
    }
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


/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

const Peer = __webpack_require__(27);
const {
  messageValidators, info, infoAck,
  messageTypes: { info: infoType, infoAck: infoAckType }
} = __webpack_require__(5);
const { getCurTimestamp } = __webpack_require__(2);
const { getSocketAddress } = __webpack_require__(3);

if (true) {
  // running in node

  var EventEmitter = __webpack_require__(1);

} else { var EventEmitter; }

// ********************* requiring ends *********************

// allowed message types during handshake
const MSG_TYPES = [infoType, infoAckType];

class PendingSocket {
  constructor(socket, incoming) {
    // the pending socket itself
    this.socket = socket;

    // inbound or outbound
    this.incoming = incoming;

    // 'INIT'
    // 'INFO_SENT'
    // 'ESTABLISHED'
    this.state = 'INIT';

    // the timestamp when socket is created
    this.timestamp = getCurTimestamp();

    // remote info
    this.uuid = undefined;
    this.nodeType = undefined;
    this.daemonPort = undefined;
  }
}

// ******************** common code ends ********************

// **************** env-specific code starts ****************

if (true) {
  // run in node

  var HandshakeManager = class extends EventEmitter {
    constructor(p2pProtocol) {
      super();
      this.socketConnectHandler = this.socketConnectHandler.bind(this);

      this.litenode = p2pProtocol.litenode;
      this.uuid = p2pProtocol.litenode.uuid;
      this.nodeType = p2pProtocol.node.nodeType;
      this.daemonPort = p2pProtocol.litenode.daemonPort;

      // sockets => pending sockets (which is a wrapper)
      this.pendingSockets = new Map();

      // listen on new socket connection
      this.litenode.on('socketconnect', this.socketConnectHandler);

      // in case too many pending connections (such as DDoS),
      // drop pending connections after roughly 20s' idle
      this.timer = setInterval(() => {
        let now = getCurTimestamp();
        for (let [socket, pendingSocket] of this.pendingSockets) {
          if (now - pendingSocket.timestamp > 20000) {
            console.warn(`Handshake timeouts with ${getSocketAddress(socket)}.`);
            socket.close(undefined, 'HANDSHAKE_TIMEOUTS');
            this.pendingSockets.delete(socket);
          }
        }

      }, 10000);
    }

    addPendingSocket(socket, incoming) {
      try {
        let pendingSocket = new PendingSocket(socket, incoming);
        let proxiedSocket = this.litenode.createSocketProxy(socket, 'N/A');

        socket._messageHandler = ((message) => {
          try {
            let { state } = pendingSocket
            let { messageType, ...payload } = JSON.parse(message);
            if (typeof messageType !== 'string' || !MSG_TYPES.includes(messageType)) {
              throw new Error();
            }

            if (this.litenode.debug) {
              // note that only logs valid procotol messages
              this.litenode.messageLogs.push({
                peer: 'N/A',
                dir: 'inbound',
                msg: { messageType, ...payload },
                time: getCurTimestamp('s')
              });
            }
            
            // when receiving info message
            if (messageType === infoType) {
              messageValidators[infoType](payload);
    
              if (incoming && state === 'INIT') {
                pendingSocket.state = 'INFO_SENT'
                pendingSocket.uuid = payload.uuid;
                pendingSocket.nodeType = payload.nodeType;
                pendingSocket.daemonPort = payload.daemonPort;
    
                this.sendInfo(proxiedSocket);
    
              } else if (!incoming && state === 'INFO_SENT') {
                pendingSocket.state = 'ESTABLISHED';
                pendingSocket.uuid = payload.uuid;
                pendingSocket.nodeType = payload.nodeType;
                pendingSocket.daemonPort = payload.daemonPort;
    
                this.sendInfoAck(proxiedSocket);
                this.onEstablished(pendingSocket);
    
              } else {
                throw new Error();
              }
            }
    
            // when receiving info ack message
            if (messageType === infoAckType) {
              messageValidators[infoAckType](payload);
    
              if (incoming && state === 'INFO_SENT') {
                pendingSocket.state = 'ESTABLISHED';
    
                this.onEstablished(pendingSocket);
    
              } else {
                throw new Error();
              }
            }
    
          } catch (err) {
            console.warn(`Handshake failed with ${getSocketAddress(socket)}, reason:\n${err.stack}`);
            // close the underlying socket
            socket.close(undefined, 'HANDSHAKE_FAILED');
          }

        }).bind(this); // end of _messageHandler

        socket.on('message', socket._messageHandler);
        socket.on('close', (code, reason) => {
          this.pendingSockets.delete(socket);
        });
        this.pendingSockets.set(socket, pendingSocket);

        if (!incoming) {
          // sending the first info message
          // to initiate the handshake process
          this.sendInfo(proxiedSocket);
          pendingSocket.state = 'INFO_SENT'
        }

      } catch (err) {
        console.warn(`Handshake failed with ${getSocketAddress(socket)}, reason:\n${err}`);
        // close the underlying socket
        socket.close(undefined, 'HANDSHAKE_FAILED');
      }
    }

    socketConnectHandler(socket, incoming) {
      this.addPendingSocket(socket, incoming);
    }

    // on handshake completing
    onEstablished(pendingSocket) {
      let { socket, incoming, uuid, nodeType, daemonPort } = pendingSocket;
      let peer = new Peer(uuid, socket, incoming, daemonPort, nodeType);

      socket.removeListener('message', socket._messageHandler);
      delete socket._messageHandler
      
      this.pendingSockets.delete(socket);
      this.litenode.addNewPeer(peer);
    }

    sendInfo(socket) {
      socket.send(JSON.stringify(info({
        uuid: this.uuid, 
        nodeType: this.nodeType,
        daemonPort: this.daemonPort
      })));
    }

    sendInfoAck(socket) {
      socket.send( JSON.stringify(infoAck()) );
    }

    /**
     * Do the cleanup.
     */
    close() {
      if (this.timer) {
        clearInterval(this.timer);
      }
    }
  }; // end of HandshakeManager

} else { var HandshakeManager; }

module.exports = HandshakeManager;


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

const P2PProtocol = __webpack_require__(9);
const LiteProtocolStore = __webpack_require__(29);
const Miner = __webpack_require__(30);
const Blockchain = __webpack_require__(35);
const HandshakeManager = __webpack_require__(11);
const InventoryResolver = __webpack_require__(36);
const createRestServer = __webpack_require__(37);
const createBlock = __webpack_require__(13);
const {
  messageTypes, messageValidators, getBlocks, 
  inv, data, getPendingMsgs
} = __webpack_require__(5);
const {
  verifyBlock, verifyLitemsg, calcMerkleRoot, verifySubchain
} = __webpack_require__(0);
const { pickItems } = __webpack_require__(4);
const { getCurTimestamp } = __webpack_require__(2);

// protcol version
const VERSION = 1;
// mining difficulty
const BITS = 22;
// block size limit
const BLOCK_LIMIT = 2048;
// node types to re/connect automatically
const AUTO_CONN_NODE_TYPES = ['full']

/**
 * This is the actual litemessage protocol implementation
 * for "full" nodes.
 */
class LiteProtocol extends P2PProtocol {
  static get ver() {
    return VERSION;
  }

  constructor(node) {
    super(node, { nodeTypes: AUTO_CONN_NODE_TYPES });
    this.getBlocksHandler = this.getBlocksHandler.bind(this);
    this.invHandler = this.invHandler.bind(this);
    this.getDataHandler = this.getDataHandler.bind(this);
    this.dataHandler = this.dataHandler.bind(this);
    this.getPendingMsgsHandler = this.getPendingMsgsHandler.bind(this);
    this.peerConnectHandler = this.peerConnectHandler.bind(this);

    this.liteStore = new LiteProtocolStore(node.db);
    // a blockchain manager
    this.blockchain = new Blockchain(this.liteStore);
    this.miner = new Miner();
    // map litemessage id to litemessage itself (pending litemessages)
    this.litemsgPool = {};

    // wait for blockchain initializing itself
    this.blockchain.on('ready', () => this.init());

    this.blockchain.on('error', err => {
      console.error(err);
      process.exit(1);
    });
  }

  init() {
    // register message/connection handlers
    this.litenode.on(`message/${messageTypes.getBlocks}`, this.getBlocksHandler);
    this.litenode.on(`message/${messageTypes.inv}`, this.invHandler);
    this.litenode.on(`message/${messageTypes.getData}`, this.getDataHandler);
    this.litenode.on(`message/${messageTypes.data}`, this.dataHandler);
    this.litenode.on(`message/${messageTypes.getPendingMsgs}`, this.getPendingMsgsHandler);
    this.litenode.on('peerconnect', this.peerConnectHandler);

    // instantiate a handshake manager so that
    // our node can connect to other nodes : P
    this.handshake = new HandshakeManager(this);

    if (this.litenode.debug) {
      // create and run rest server
      let debugPort = this.litenode.daemonPort + 1;
      createRestServer(this).listen(debugPort);
      console.log(`Debugging RESTful API server listening on port ${debugPort}.`);
    }

    // some schedule tasks (interval timers)
    this.timers = [];

    // schedule mining
    this.timers.push(
      setInterval(async () => {
        if (!this.miner.mining && Object.entries(this.litemsgPool).length) {
          this.mineNextBlock();
        }

      }, 1000)
    );

    // schedule getting pending messages
    this.timers.push(
      setInterval(() => {
        if (Object.entries(this.litemsgPool).length > 0) { return; }

        try {
          pickItems(this.node.peers('full'), 8)
            .forEach(peer => peer.sendJson(getPendingMsgs()))
        } catch (err) { console.warn(err); }

      }, 30000)
    );

    // protocol handling setup is ready now
    this.emit('ready');
  }

  async getNextBlock() {
    let time = getCurTimestamp();
    let litemsgs = pickItems(Object.values(this.litemsgPool), BLOCK_LIMIT);
    let merkleRoot = calcMerkleRoot(litemsgs.map(m => m.hash));
    let { 
      height = -1, hash: prevBlock = undefined 
    } = await this.blockchain.getHeadBlock() || {};
    height += 1;
    
    return createBlock(VERSION, time, height, prevBlock, merkleRoot, BITS, undefined, litemsgs);
  }

  async mineNextBlock() {
    let block = await this.getNextBlock();
    block = await this.miner.mine(block);
    let headBlockId = this.blockchain.getHeadBlockIdSync();

    if (!headBlockId || block.prevBlock === headBlockId) {
      let now = getCurTimestamp();
      let timeTaken = Math.round((now - block.time) / 1000);
      console.log(`Successfully mined a new block (${timeTaken} s): ${block.hash}.`);

      // append the mined block to blockchain
      this.blockchain.append(block);

      // remove from pending message pool
      for (let litemsg of block.litemsgs) {
        delete this.litemsgPool[litemsg.hash];
      }

      // broadcast to peers
      this.litenode.broadcastJson(inv({ blocks: [block.hash] }));
    }
  }

  /**
   * After receiving blocks from a peer and verifying them, call this
   * func to remove litemessages (if any) which exist in these blocks
   * before appending them to the blockchain.
   * 
   * @param {*} blocks blocks (already verified) received from a peer
   */
  cleanPoolAndRestartMining(blocks) {
    for (let block of blocks) {
      for (let litemsg of block.litemsgs) {
        delete this.litemsgPool[litemsg.hash];
      }
    }

    if (Object.entries(this.litemsgPool).length) {
      this.mineNextBlock();
    }
  }

  inLitemsgPool(litemsgId) {
    return !!this.litemsgPool[litemsgId];
  }

  /**
   * If the given litemessage id is in LevelDB's litemessage index
   * or it's in the pending pool, the return value will be `true`.
   */
  async hasLitemsg(litemsgId) {
    return (await this.liteStore.hasLitemsg(litemsgId))
      || this.inLitemsgPool(litemsgId);
  }

  async getBlocksHandler({ messageType, ...payload }, peer) {
    try {
      messageValidators[messageType](payload);
      let { blockLocators } = payload;
      let forkedBranch = this.blockchain.getForkedBranchSync(blockLocators);

      if (forkedBranch.length) {
        // send response based on received locators
        peer.sendJson(inv({ blocks: forkedBranch }));
      }

    } catch (err) {
      console.warn(err);
    }
  }

  async invHandler({ messageType, ...payload }, peer) {
    try {
      messageValidators[messageType](payload);
      // Note the "blocks" here either is a single block just
      // mined by peer, or is a sub blockchain, which, in
      // other words, means those blocks are consecutive.
      // This is just due to how the protocol is designed.
      let { blocks, litemsgs } = payload;
      let blocksToGet = [];
      let litemsgsToGet = [];

      // Filter out blocks already have (blocks off main branch 
      // still as being haven). Also note that those blocks haven
      // by the current node, if any, must always certainly reside
      // at the beginning of received `inv`'s blockchain. Again,
      // this is just due to how the protocol is designed.
      for (let blockId of blocks) {
        if (!(await this.blockchain.hasBlock(blockId, false))) {
          blocksToGet.push(blockId);
        }
      }

      // filter out litemessages already have
      for (let litemsgId of litemsgs) {
        if (!(await this.hasLitemsg(litemsgId))) {
          litemsgsToGet.push(litemsgId);
        }
      }

      if (blocksToGet.length || litemsgsToGet.length) {
        peer._resolver.resolve({
          blocks: blocksToGet,
          litemsgs: litemsgsToGet
        });
      }

    } catch (err) {
      console.warn(err);
    }
  }

  async getDataHandler({ messageType, ...payload }, peer) {
    try {
      messageValidators[messageType](payload);
      let { blocks, litemsgs } = payload;
      let respBlocks = null;
      let respLitemsgs = [];

      // give blocks no matter which branch they are on
      respBlocks = await Promise.all(
        blocks.map(blockId => this.blockchain.getBlock(blockId))
      );
      respBlocks = respBlocks.filter(block => typeof block !== 'undefined');

      for (let litemsgId of litemsgs) {
        // note only return litemessages from pool for `getData`
        let litemsg = this.litemsgPool[litemsgId];
        if (litemsg) { respLitemsgs.push(litemsg); }
      }

      if (respBlocks.length || respLitemsgs.length) {
        // send response
        peer.sendJson(
          data({ blocks: respBlocks, litemsgs: respLitemsgs })
        );
      }

    } catch (err) {
      console.warn(err);
    }
  }

  /**
   * TODO sync pool and restart mining?
   */
  async dataHandler({ messageType, ...payload }, peer) {
    try {
      messageValidators[messageType](payload);
      let { blocks, litemsgs } = payload;
      let relayBlocks = []; // always 0 or 1 element
      let relayLitemsgs = [];

      // filter out invalid blocks and litemessages
      blocks = blocks.filter(block => verifyBlock(block));
      blocks.sort((a, b) => a.height - b.height);
      litemsgs = litemsgs.filter(litemsg => verifyLitemsg(litemsg));

      let headBlockId = this.blockchain.getHeadBlockIdSync();

      if (blocks.length && blocks[blocks.length - 1].height > this.blockchain.getCurHeightSync()) {
        if (blocks.length === 1) {
          let block = blocks[0];

          if (block.prevBlock === headBlockId) {
            this.cleanPoolAndRestartMining(blocks);
            this.blockchain.append(block);
            relayBlocks.push(block);
          } else {
            let blockLocators = this.blockchain.getLocatorsSync();
            peer.sendJson(getBlocks({ blockLocators }));
          }
        } else {
          // Note that `prevBlockId` and `prevBlock` down below refer to same block.
          // Later, they will be used for traversing backward along the blockchain.
          let prevBlockId = blocks[0].prevBlock;
          let prevBlock = prevBlockId ? 
            (await this.blockchain.getBlock(prevBlockId)) : 
            undefined;

          if (verifySubchain(blocks, prevBlock)) {
            // For efficiency, node doesn't fetch blocks on forked branch which it already 
            // has. The `litemsg_${litemsg_id}` of these mentioned blocks might be records
            // on the main branch (before appending). So here, suppose the previous
            // block of appended blocks is not on main branch, we need to extend from
            // the appended blocks backwards to until a block which is on the main 
            // branch, or until the genesis block (of the forked branch), whichever reaches
            // first. And then rewrite all `litemsg_${litemsg_id}` records so that all 
            // litemessages are correctly indexed after switching to another branch.

            let extendedBlocks = [];

            while (prevBlockId && !this.blockchain.onMainBranchSync(prevBlockId)
              && headBlockId === this.blockchain.getHeadBlockIdSync()) {

              extendedBlocks.unshift(prevBlock);

              prevBlockId = prevBlock.prevBlock;
              prevBlock = prevBlockId ?
                (await this.blockchain.getBlock(prevBlockId)) :
                undefined;
            }

            if (headBlockId === this.blockchain.getHeadBlockIdSync()) {
              this.cleanPoolAndRestartMining(blocks);
              // switch the blockchain to another branch
              this.blockchain.appendAt([...extendedBlocks, ...blocks]);
            }
          }
        }
      }

      // process received litemessages
      for (let litemsg of litemsgs) {
        if (await this.hasLitemsg(litemsg.hash)) { continue; }

        relayLitemsgs.push(litemsg.hash);
        this.litemsgPool[litemsg.hash] = litemsg;
      }

      if (relayBlocks.length || relayLitemsgs.length) {
        // relay (broadcast) data messaage
        this.litenode.broadcastJson(
          inv({ blocks: relayBlocks, litemsgs: relayLitemsgs }),
          [peer.uuid]
        );
      }

    } catch (err) {
      console.warn(err);
    }
  }

  getPendingMsgsHandler({ messageType, ...payload }, peer) {
    try {
      messageValidators[messageType](payload);
      let litemsgs = Object.keys(this.litemsgPool);

      if (litemsgs.length) {
        // send response
        peer.sendJson(inv({ litemsgs }));
      }

    } catch (err) {
      console.warn(err);
    }
  }

  peerConnectHandler(peer) {
    if (peer.nodeType === 'full' && this.node.peers('full').length === 1) {
      // wait for 30 seconds to retrieve blocks
      // because of concorrent resolving (it takes
      // time to construct connections with peers)
      setTimeout(() => {
        let blockLocators = this.blockchain.getLocatorsSync();
        peer.sendJson(getBlocks({ blockLocators }));
      }, 60000);
    }

    peer._resolver = new InventoryResolver(peer, this);
  }

  close() {
    for (let timer of this.timers) {
      clearInterval(timer);
    }
    if (this.handshake) { this.handshake.close(); }
    super.close();
  }
}

module.exports = LiteProtocol;


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

const { sha256 } = __webpack_require__(0);

/**
 * Note for genesis block, its `height` must be 0, and `prevBlock` be `undefined`.
 * 
 * @param {*} ver         version number (now hardcoded to 1, I don't have time :|)
 * @param {*} time        timestamp (unix time)
 * @param {*} height
 * @param {*} prevBlock   previous block's id
 * @param {*} merkleRoot  merkle root
 * @param {*} bits        difficulty
 * @param {*} nonce       nonce
 * @param {*} litemsgs    an array of litemessages (not ids)
 */
const createBlock = (ver, time, height, prevBlock, merkleRoot, bits, nonce, litemsgs) => {
  let hash = undefined;
  if (typeof nonce === 'number') {
    // only calculate hash when `nonce` is given
    hash = sha256(`${ver}${time}${height}${prevBlock}${merkleRoot}${bits}${nonce}`);
  }
  return { ver, time, height, prevBlock, merkleRoot, bits, nonce, litemsgs, hash };
};

module.exports = createBlock;


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

if (true) {
  // node (output as commonjs)

  exports.Node = __webpack_require__(6);
  exports.ThinNode = __webpack_require__(22);
  exports.FullNode = __webpack_require__(28);

  exports.createLitemsg = __webpack_require__(43);
  exports.LiteProtocol = __webpack_require__(12);
  exports.ThinLiteProtocol = __webpack_require__(8);
  module.exports = exports =  { ...exports, ...__webpack_require__(5) };

  module.exports = exports = { ...exports, ...__webpack_require__(0) };
  module.exports = exports = { ...exports, ...__webpack_require__(2) };
  
} else {}


/***/ }),
/* 15 */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),
/* 16 */
/***/ (function(module, exports) {

module.exports = require("uuid/v1");

/***/ }),
/* 17 */
/***/ (function(module, exports) {

module.exports = require("leveldown");

/***/ }),
/* 18 */
/***/ (function(module, exports) {

module.exports = require("levelup");

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

const EventEmitter = __webpack_require__(1);
const WSServer = __webpack_require__(20);
const { getSocketAddress } = __webpack_require__(3);
const { getCurTimestamp } = __webpack_require__(2);

/**
 * This class is the abstraction of "node" (litenode) inside the litemessage
 * peer-to-peer network. It is on top of Websocket layer by composing `WSServer`
 * when runing in nodejs environment, or `WSClient` when runing as "thin" node in
 * both nodejs and browser environments. 
 * 
 * This class is protocol-agnostic, meaning it doesn't assume any detail of
 * the implmentation of litemessage's protocol. Instead, it just provides some
 * APIs and async events for implementing the protocol and any kind of litemessage
 * client ("thin" / "full" node) on top of that.
 * 
 * You must provide a UUID to the contructor. The UUID is the unique identifier 
 * identify a unique node inside the peer-to-peer network.
 * 
 * By default, node use 1113 as the daemon port inside the network.
 * 
 * TODO log handshake communication traffic
 * TODO use debug config, also support cli to specify
 * TODO support specifying the interface to bind
 * 
 * #### Events
 * - `socketconnect` - low level socket connection (simple wrapper around wss's)
 * - `peerconnect` - high level peer connection
 * - `peerdisconnect` - high level peer disconnection
 * - `message/${message_type}` - high level protocol-specific messages
 * 
 * All other events are handled by low level abstraction, so you don't need to
 * worry about : P
 */
class LiteNode extends EventEmitter {
  constructor(uuid, { port = 1113, debug = false } = {}) {
    super();
    this.socketConnectHandler = this.socketConnectHandler.bind(this);
    this.socketMessageHandler = this.socketMessageHandler.bind(this);
    this.socketCloseHandler = this.socketCloseHandler.bind(this);

    this.uuid = uuid;
    this.daemonPort = port;

    // node's uuid => peer
    this.peers = {};
    // remote socket addresses (str) => peers
    this.socketsToPeers = {};

    // used for debugging (view all protocol messages since start)
    this.debug = debug;
    this.messageLogs = [];

    // create the underlyng websocket server
    this.wss = new WSServer(port);
    // when bound to an network interface
    this.wss.on('listening', (port) => {
      console.log(`${uuid}: Start listening on port ${port}.`);
      if (debug) { console.log('Debug mode is enabled.'); }
    });
    // when new connection established
    this.wss.on('connection', this.socketConnectHandler);
  }

  /**
   * Create a proxy to intercept the `send` function call,
   * mainly for debugging / logging.
   */
  createSocketProxy(socket, remoteUuid) {
    if (!this.debug) { return socket; }

    const messageLogs = this.messageLogs;

    const handler = {
      get: (socket, propName) => {
        if (propName !== 'send') { return socket[propName]; }
        // return the wrapper function as a proxy
        return function (data, options, callback) {
          messageLogs.push({
            peer: remoteUuid,
            dir: 'outbound',
            msg: JSON.parse(data),
            time: getCurTimestamp('s')
          });

          return socket.send(data, options, callback);
        };
      }
    };
    // create socket proxy and return
    return new Proxy(socket, handler);
  }

  /**
   * Note that you cannot have more than one socket to a single URL.
   * And also note that error could be thrown if url is invalid.
   * Failure of connection will only cause some log (won't crash
   * the application).
   * 
   * Right now, there's no way to get notified when it fail to connect
   * (such as because of timeout) except for a log mentioned before.
   */
  createConnection(url) {
    return this.wss.createConnection(url);
  }

  /**
   * @param {string} msg 
   * @param {Array<string>} exUuids 
   */
  broadcast(msg, exUuids = []) {
    let peers = Object.keys(this.peers)
      .filter(uuid => !exUuids.includes(uuid))
      .map(uuid => this.peers[uuid]);

    for (let peer of peers) {
      try {
        peer.send(msg);
      } catch (err) {
        console.error(err);
      }
    }
  }

  /**
   * @param {Object} jsonObj 
   * @param {Array<string>} exUuids 
   */
  broadcastJson(jsonObj, exUuids) {
    this.broadcast(JSON.stringify(jsonObj), exUuids);
  }

  socketConnectHandler(socket, incoming) {
    let socketAddress = getSocketAddress(socket);
    if (incoming) {
      console.log(`Accepted socket connection from ${socketAddress}.`);
    } else {
      console.log(`Established socket connection to ${socketAddress}.`);
    }

    socket.on('close', (code, reason) =>
      this.socketCloseHandler(code, reason, socket));

    // notify listeners
    this.emit('socketconnect', socket, incoming);
  }

  socketMessageHandler(msg, peer) {
    let msgObj = null;
    try { msgObj = JSON.parse(msg); } catch (e) {}
    
    if (msgObj && msgObj['messageType']) {
      if (this.debug) {
        // note that only logs valid procotol messages
        this.messageLogs.push({
          peer: peer.uuid,
          dir: 'inbound',
          msg: msgObj,
          time: getCurTimestamp('s')
        });
      }

      this.emit(`message/${msgObj['messageType']}`, msgObj, peer);
    }
  }

  socketCloseHandler(code, reason, socket) {
    let socketAddress = getSocketAddress(socket);
    let peer = this.socketsToPeers[socketAddress]

    if (peer) {
      delete this.peers[peer.uuid];
      delete this.socketsToPeers[socketAddress]
      console.log(`Disconnected from ${peer.uuid}@${socketAddress}.`);
      // notify listeners
      this.emit('peerdisconnect', peer);
    }
    console.log(`Closed socket connection with ${socketAddress} (${code || 'N/A'} | ${reason || 'N/A'}).`);
  }

  /**
   * Add new peer to peer collection of this node. The protocol
   * implmementation should call this after a protocol-specific
   * handshake completes (this class is protocol agnostic).
   */
  addNewPeer(peer) {
    let { uuid, socket, incoming, nodeType } = peer;
    let socketAddress = getSocketAddress(socket);

    if (this.peers.hasOwnProperty(uuid)) {
      console.warn(`Established connection with a connected peer (${uuid}@${socketAddress});\n`
        + `so, going to disconnect from it.`);
      socket.close(undefined, 'DOUBLE_CONNECT');
      return;
    }

    peer.socket = socket = this.createSocketProxy(socket, uuid);
    this.peers[uuid] = peer;
    this.socketsToPeers[socketAddress] = peer;
    socket.on('message', (message) => 
      this.socketMessageHandler(message, peer));

    if (incoming) {
      console.log(`Accepted connection from ${peer.uuid}@${socketAddress} (${nodeType}).`);
    } else {
      console.log(`Established connection to ${peer.uuid}@${socketAddress} (${nodeType}).`);
    }

    // notify listeners
    this.emit('peerconnect', peer);
  }

  /**
   * Get some useful information about this node.
   */
  getInfo() {
    let network = this.wss.getInfo();

    if (network.sockets) {
      for (let socketInfo of network.sockets) {
        let peer = this.socketsToPeers[socketInfo.remoteSocketAddr];

        socketInfo.remoteUuid = peer.uuid;
        socketInfo.remoteDaemonPort = peer.daemonPort;
      }
    }

    return {
      uuid: this.uuid,
      daemonPort: this.daemonPort,
      network,
    };
  }

  /**
   * Close this node (both server and outgoing socket connections will
   * be closed)
   */
  close() {
    this.wss.close();
  }
}

module.exports = LiteNode;


/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

const EventEmitter = __webpack_require__(1);
const WebSocket = __webpack_require__(21);
const { URL } = __webpack_require__(7);
const { getSocketAddress, getSocketInfo } = __webpack_require__(3);

/**
 * Provide abstraction for underlaying transportation protocol. It behaves 
 * both like a server and a client - it will connect to several clients, 
 * and also several servers (P2P network).
 * 
 * The P2P network is a directed graph with bidirectional communication channels.
 * 
 * TODO docker delievery
 * TODO investigate event emitter memory leak
 * TODO close reason doesn't work
 * 
 * ##### Events
 * - `listening` (port: string) - when the underlying ws server binds successfully
 * - `connection` (socket, incoming) - low level socket connection
 * 
 * For all other events, use the underlying web socket object.
 */
class WSServer extends EventEmitter {
  constructor(port) {
    super();
    this.connectionHandler = this.connectionHandler.bind(this);
    
    // map remote socket addresses (ip:port) to sockets
    this.servers = {};
    this.port = port;
    
    // create underlaying server and listen
    this.wss = new WebSocket.Server({ port });
    // when bound to an network interface
    this.wss.on('listening', () => this.emit('listening', port));
    // when receiving incoming connection
    this.wss.on('connection', (socket, req) => {
      this.connectionHandler(socket, true);
    });
    // when websocket server has error (don't crash it)
    this.wss.on('error', console.log);

    // set up heartbeats
    this.timer = setInterval(this.genHeartbeat(), 60000);
  }

  /**
   * Note that you cannot have more than one socket to a single URL.
   * And also note that error could be thrown if url is invalid.
   * Failure of connection will only cause some logs (won't crash
   * the application).
   * 
   * Right now, there's no way to get notified when it fails to connect
   * (such as because of timeout) except for a log mentioned before.
   */
  createConnection(url) {
    let socketAddress = null;
    let remoteDaemonPort = null;
    try {
      ({ host: socketAddress, port: remoteDaemonPort } = new URL(url));
      if (!socketAddress || !remoteDaemonPort.match(/^\d+$/)) { throw new Error(); }
    } catch (err) {
      throw new Error(`Wrong url (${url}) to connect.`);
    }

    let prevSocket = this.servers[socketAddress];
    if (prevSocket && this.socketAlive(prevSocket)) {
      console.warn(`Tried to connect to same url (${url}) twice. Operation aborted.`);
      return;
    }

    let socket = new WebSocket(url, { handshakeTimeout: 10000 });

    socket.on('error', (err) =>
      console.log(`Unable to establish connection to ${url}. Details:\n${err}.`));

    socket.on('open', () => {
      let prevSocket = this.servers[socketAddress];
      if (prevSocket && this.socketAlive(prevSocket)) {
        // TODO investigate memory leak
        socket.on('close', () => socket.removeAllListeners());
        socket.close(undefined, 'DOUBLE_CONNECT');
        return;
      }
      socket.removeAllListeners('error');
      this.connectionHandler(socket, false);
      this.servers[socketAddress] = socket;
    });
  }

  genHeartbeat() {
    let noop = () => {};
    return () => {
      for (let socket of [...this.wss.clients, ...Object.values(this.servers)]) {
        if (this.socketAbnormal(socket)) {
          socket.terminate();
        }
        // set socket `alive` to false, later pong response
        // from client will recover `alive` from false to true
        socket.alive = false;
        socket.ping(noop);
      }
    }
  }

  /**
   * @param {*} socket                  the underlaying socket
   * @param {boolean} incoming          whether the connection is incoming
   */
  connectionHandler(socket, incoming) {
    let socketAddress = getSocketAddress(socket);
    socket.alive = true;
    socket.on('message', () => socket.alive = true);
    socket.on('pong', () => socket.alive = true);
    socket.on('close', () => {
      socket.alive = false;
      socket.removeAllListeners();
      if (socket === this.servers[socketAddress]) {
        delete this.servers[socketAddress];
      }
    });
    socket.on('error', err => {
      console.log(err);
      socket.terminate();
    });
    // notify subscribers
    this.emit('connection', socket, incoming);
  }

  socketAbnormal(socket) {
    return !socket.alive && socket.readyState === WebSocket.OPEN;
  }

  socketAlive(socket) {
    return socket.readyState === WebSocket.OPEN;
  }

  /**
   * Get some useful information about the network.
   */
  getInfo() {
    let sockets = [];

    for (let socket of this.wss.clients) {
      sockets.push({
        dir: 'inbound',
        ...getSocketInfo(socket)
      });
    }
    for (let socket of Object.values(this.servers)) {
      sockets.push({
        dir: 'outbound',
        ...getSocketInfo(socket)
      });
    }

    return {
      port: this.port,
      sockets
    };
  }

  /**
   * Close this node (both server and outgoing socket connections will
   * be closed)
   */
  close() {
    clearInterval(this.timer);
    this.wss.close();
  }
}

module.exports = WSServer;


/***/ }),
/* 21 */
/***/ (function(module, exports) {

module.exports = require("ws");

/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

const Node = __webpack_require__(6);
const ThinLiteProtocol = __webpack_require__(8);

const NODE_TYPE = 'thin';

class ThinNode extends Node {
  constructor(dbPath, { protocolClass = ThinLiteProtocol, initPeerUrls = [], port, debug } = {}) {
    super(NODE_TYPE, dbPath, port, protocolClass, initPeerUrls, debug);
  }

  static get nodeType() {
    return NODE_TYPE;
  }

  close() {
    super.close();
  }
}

module.exports = ThinNode;


/***/ }),
/* 23 */
/***/ (function(module, exports) {

module.exports = require("dns");

/***/ }),
/* 24 */
/***/ (function(module, exports) {

module.exports = require("util");

/***/ }),
/* 25 */
/***/ (function(module, exports) {

const prefix = 'p2p/';

const genKey = key => prefix + key;

class P2PProtocolStore {
  constructor(db) {
    this.db = db;
  }

  /**
   * Flush current connected peers' URLs into DB. 
   * Note that you should only provide peers with 
   * desired `nodeType`s.
   */
  async writeCurPeerUrls(peerUrls) {
    let data = JSON.stringify(peerUrls);
    return this.db.put(genKey('cur_peer_urls'), data);
  }

  async readCurPeerUrls() {
    try {
      let buf = await this.db.get(genKey('cur_peer_urls'));
      return JSON.parse(buf.toString());
    } catch (err) {
      if (err.notFound) { return []; }
      throw err;
    }
  }
}

module.exports = P2PProtocolStore;


/***/ }),
/* 26 */
/***/ (function(module, exports) {

// message type constants
const messageTypes = Object.freeze({
  fetchPeers: 'p2p/fetch_peers',
  returnPeers: 'p2p/return_peers'
});


/**
 * 
 */
const fetchPeers = ({ nodeTypes, limit = 20 } = {}) => ({
  messageType: messageTypes.fetchPeers, 
  nodeTypes, 
  limit
});

fetchPeers.validate = ({ nodeTypes, limit }) => {
  if (!(nodeTypes instanceof Array) || nodeTypes.length === 0) {
    throw new Error('p2p/: Invalid message, field nodeTypes.');
  }
  if (typeof limit !== 'number' || limit <= 0) {
    throw new Error('p2p/: Invalid message, field limit.');
  }
};


/**
 * 
 */
const returnPeers = ({ nodeTypes, peerUrls = [] } = {}) => ({
  messageType: messageTypes.returnPeers, 
  nodeTypes, 
  peerUrls
});

returnPeers.validate = ({ nodeTypes, peerUrls }) => {
  if (!(nodeTypes instanceof Array) || nodeTypes.length === 0) {
    throw new Error('p2p/: Invalid message, field nodeTypes.');
  }
  if (!(peerUrls instanceof Array)) {
    throw new Error('p2p/: Invalid message, field peerUrls.');
  }
};


// validators
const messageValidators = Object.freeze({
  [messageTypes.fetchPeers]: fetchPeers.validate,
  [messageTypes.returnPeers]: returnPeers.validate
});


exports.messageTypes = messageTypes;
exports.messageValidators = messageValidators;
exports.fetchPeers = fetchPeers;
exports.returnPeers = returnPeers;


/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

const { getRemoteAddress, getSocketAddress } = __webpack_require__(3);

class Peer {
  /**
   * @param {string} uuid             peer's uuid
   * @param {*} socket                network socket to the peer
   * @param {boolean} incoming        whether the connection is incoming
   * @param {string} daemonPort       peer's daemon port
   * @param {string} nodeType         peer's node type
   */
  constructor(uuid, socket, incoming, daemonPort, nodeType) {
    this.uuid = uuid;
    this.socket = socket;
    this.incoming = incoming;
    this.daemonPort = daemonPort;
    this.nodeType = nodeType;
    this.url = `ws://${getRemoteAddress(socket)}:${daemonPort}`;
  }

  /**
   * Note that error might be thrown, such as when trying to 
   * send data through closed connection (very rare though - the
   * underlaying litenode will take care of that).
   * 
   * @param {string} message to send
   */
  send(msg) {
    this.socket.send(msg);
  }

  /**
   * Note that error might be thrown, such as when trying to 
   * send data through closed connection (very rare though - the
   * underlaying litenode will take care of that).
   * 
   * @param {Object} jsonObj object to send
   */
  sendJson(jsonObj) {
    this.send(JSON.stringify(jsonObj));
  }

  toString() {
    return `${this.nodeType} - ${this.url}`;
  }

  toJSON() {
    return {
      uuid: this.uuid,
      remoteAddr: getSocketAddress(this.socket),
      daemonPort: this.daemonPort,
      incoming: this.incoming,
      type: this.nodeType
    };
  }
}

module.exports = Peer;


/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

const Node = __webpack_require__(6);
const LiteProtocol = __webpack_require__(12);

const NODE_TYPE = 'full';

/**
 * The Litemessage fully functional node client.
 * 
 * TODO fails to bind should crash the client imediately
 */
class FullNode extends Node {
  constructor(dbPath, { protocolClass = LiteProtocol, initPeerUrls = [], port, debug } = {}) {
    super(NODE_TYPE, dbPath, port, protocolClass, initPeerUrls, debug);

    this.timer = setInterval(() => {
      console.log(`Right now, there are ${this.peers().length} connected peers (full & thin).`);
      // TODO this.debugInfo();
    }, 20000);
  }

  static get nodeType() {
    return NODE_TYPE;
  }

  close() {
    clearInterval(this.timer);
    super.close();
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


/***/ }),
/* 29 */
/***/ (function(module, exports) {

const prefix = 'lite/';

const genKey = key => prefix + key;

class LiteProtocolStore {
  constructor(db) {
    this.db = db;
  }

  static get genKey() {
    return genKey;
  }

  // async writeHeadBlock(blockId) {
  //   return this.db.put(genKey('head_block'), blockId);
  // }

  /**
   * Note that we don't index litemessage's content, which is part of a block.
   * So in order to get the content of a litemessage, you must get the the block
   * where the given litemessage resides first.
   * 
   * This function return the block id (no matter the block in the main branch or
   * not) where the given litemessage resides, or undefined if we don't have the
   * litemessage in any block.
   */
  async readLitemsg(litemsgId) {
    try {
      let buf = await this.db.get(genKey(`litemsg_${litemsgId}`));
      return buf.toString();

    } catch (err) {
      if (err.notFound) { return undefined; }
      throw err;
    }
  }

  /**
   * TODO might change this: we don't need to have index for litemessages?
   * might just litemessage's location index (in which block).
   */
  // async writeLitemsg(litemsg) {
  //   if (typeof litemsg.hash !== 'string') {
  //     throw new Error('Invalid litemessage hash.');
  //   }
  //   return this.db.put(genKey(`litemsg_${litemsg.hash}`), litemsg);
  // }

  async hasLitemsg(litemsgId) {
    return (await this.readLitemsg(litemsgId)) !== undefined;
  }

  // following is block-related ...

  /**
   * Return the head block's **id** (or undefined when there's no
   * block in the blockchain)
   */
  async readHeadBlock() {
    try {
      let buf = await this.db.get(genKey('head_block'));
      return buf.toString();
    } catch (err) {
      if (err.notFound) { return undefined; }
      throw err;
    }
  }

  // async writeBlock(block) {
  //   if (typeof block.hash !== 'string') {
  //     throw new Error('Invalid block hash.');
  //   }
  //   return this.db.put(genKey(`block_${block.hash}`), block);
  // }

  /**
   * Return the whole block specified by the given block id.
   * If block doesn't exist, `undefined` will be returned.
   */
  async readBlock(blockId) {
    try {
      let buf = await this.db.get(genKey(`block_${blockId}`));
      return JSON.parse(buf.toString());
      
    } catch (err) {
      if (err.notFound) { return undefined; }
      throw err;
    }
  }

  /**
   * Append one more block on top of the current head block.
   */
  async appendBlock(block, batchOps) {
    if (typeof block.hash !== 'string') {
      throw new Error('Invalid block hash.');
    }

    let ops = [
      { type: 'put', key: genKey(`block_${block.hash}`), value: JSON.stringify(block) },
      { type: 'put', key: genKey('head_block'), value: block.hash }
    ];
    for (let litemsg of block.litemsgs) {
      ops.push({ type: 'put', key: genKey(`litemsg_${litemsg.hash}`), value: block.hash });
    }
    if (batchOps) {
      ops = [...ops, ...batchOps];
    }

    return this.db.batch(ops);
  }

  /**
   * Sometimes forks could happen. Call this to switch to
   * another fork.
   * 
   * @param {*} blocks  blocks from another branch to switch
   */
  async appendBlocksAt(blocks, batchOps) {
    if (!blocks.length) { return; }

    let headBlock = blocks[blocks.length - 1];
    let ops = [];

    for (let block of blocks) {
      if (typeof block.hash !== 'string') { throw new Error('Invalid block hash.'); }

      ops.push({ type: 'put', key: genKey(`block_${block.hash}`), value: JSON.stringify(block) });
      for (let litemsg of block.litemsgs) {
        ops.push({ type: 'put', key: genKey(`litemsg_${litemsg.hash}`), value: block.hash });
      }
    }
    ops.push({ type: 'put', key: genKey('head_block'), value: headBlock.hash });

    if (batchOps) { ops = [...ops, ...batchOps]; }

    return this.db.batch(ops);
  }
}

module.exports = LiteProtocolStore;


/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

const { mine } = __webpack_require__(0);
const createBlock = __webpack_require__(13);

/**
 * mining manager : )
 */
class Miner {
  /**
   * Use `mine` down below; it has easier interface.
   * 
   * Start mining. If at the point you call this function,
   * a mining is going on, that mining will be canceled
   * automatically (right now doesn't support concurrent
   * mining).
   * 
   * Note that if the mining is canceled, it won't trigger
   * `resolve` or `reject` of the returned promise.
   */
  calc(content, bits) {
    if (this.mining) { this.cancel(); }
    this.mining = mine(content, bits);
    return this.mining
      .then(nonce => {
        this.mining = null;
        return nonce;
      })
      .catch(err => {
        this.mining = null;
        throw err;
      });
  }

  /**
   * Note that it won't change the orginal block, but return a new
   * successfully mined block.
   * 
   * @param {*} block 
   */
  mine(block) {
    const { ver, time, height, prevBlock, merkleRoot, bits, litemsgs } = block;
    const content = `${ver}${time}${height}${prevBlock}${merkleRoot}${bits}`;
    return this.calc(content, bits)
      .then(nonce => 
        createBlock(ver, time, height, prevBlock, merkleRoot, bits, nonce, litemsgs));
  }

  cancel() {
    if (this.mining) {
      this.mining.cancel();
      this.mining = null;
    }
  }
}

module.exports = Miner;


/***/ }),
/* 31 */
/***/ (function(module, exports) {

module.exports = require("crypto");

/***/ }),
/* 32 */
/***/ (function(module, exports) {

module.exports = require("child_process");

/***/ }),
/* 33 */
/***/ (function(module, exports) {

module.exports = require("bluebird");

/***/ }),
/* 34 */
/***/ (function(module, exports) {

module.exports = require("buffer");

/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

const EventEmitter = __webpack_require__(1);

/**
 * A chunk is a fixed number of consecutive blocks (only block id) grouped
 * together stored in LevelDB in binary format (not in hex encode), mainly
 * for retrieval / flushing efficiency from or to disk.
 * 
 * NOTE that once a block is stored in LevelDB, you should NEVER change this
 * constant down below. Otherwise, data will be corrupted.
 */
const chunkSize = 1024;

/**
 * This is a very low level abstraction of a blockchain, which needs to be 
 * injected with an store (using LevelDB / IndexedDB) interface implementation
 * for interacting with persistant storage medium. Take `LiteProtocol`'s
 * implementation as an example.
 * 
 * This blockchain abstraction here is (should) be protocol-agnostic.
 * 
 * One assumption using this blockchain abstraction here is that you MUST 
 * always only persist valid blocks (it doesn't have to be in the main branch 
 * in the long run, but it must be a valid block). And you append elder blocks 
 * and then newer blocks to the blockchain, either one by one, or in a batch.
 * In other words, you MUST always append a block after all its predecessor blocks
 * have been persisted.
 * 
 * NOTE that both chunk and height (length of blockchain) start at index 0.
 */
class Blockchain extends EventEmitter {
  constructor(store) {
    super();
    this.store = store;
    this.db = store.db;
    this.genKey = store.constructor.genKey;
    
    // an array of block ids (in hex encoding)
    this.blockchain = null;
    this._ready = false;

    this.init();
  }

  get ready() {
    return this._ready;
  }

  async init() {
    try {
      let height = await this.getCurHeight() + 1;
      let numOfChunks = Math.floor(height / chunkSize);
      let numOfBlocks = height % chunkSize;

      let chunks = await Promise.all(
        Array.from(Array(numOfChunks).keys()) // generate a number sequence
          .map(num => this._getChunk(num))
      );
      // flatten chunks
      chunks = [].concat.apply([], chunks);

      let blocks = [];
      let prevBlockId = null;
      for (let i = 0; i < numOfBlocks; i++) {
        let block = await (
          i === 0 ? this.getHeadBlock() : this.getBlock(prevBlockId)
        );

        prevBlockId = block.prevBlock;
        blocks.unshift(block.hash);
      }

      this.blockchain = [...chunks, ...blocks];
      this._ready = true;
      this.emit('ready');

    } catch (err) {
      this.emit('error', err);
    }
  }

  /**
   * Inside a chunk, the order is from elder blocks to newer blocks.
   * Note that if you're trying to get a non-existent chunk, an error
   * will be thrown.
   */
  async _getChunk(serialNum) {
    let buf = await this.db.get(this.genKey(`chunk_${serialNum}`));
    let chunk = [];

    // just be cautious
    if (buf.length !== chunkSize * 32) { process.exit(1); }

    for (let i = 0; i < buf.length; i += 32) {
      chunk.push(buf.slice(i, i + 32).toString('hex'));
    }
    return chunk;
  }

  /**
   * Append next block on top of current head block on the blockchain.
   */
  async append(block) {
    const ops = [];
    this.blockchain.push(block.hash);
    let height = this.getCurHeightSync();

    if ((height + 1) % chunkSize === 0) {
      const serialNum = Math.floor((height + 1) / chunkSize) - 1;
      const buf = Buffer.from(this.blockchain.slice(height + 1 - chunkSize).join(''), 'hex');
      ops.push({ type: 'put', key: this.genKey(`chunk_${serialNum}`), value: buf });
    }

    return this.store.appendBlock(block, ops);
  }

  /**
   * Append a branch on a specific location on the blockchain, and the 
   * new branch will be the main blockchain branch.
   * 
   * TODO update chunk index
   */
  async appendAt(blocks) {
    // some cautious checks
    if (!blocks.length) { return; }
    if (blocks[blocks.length - 1].height <= this.getCurHeightSync()) {
      throw new Error('Trying to append a invalid subchain, abort.');
    }

    let at = blocks[0].height;
    let blockIds = blocks.map(block => block.hash);
    this.blockchain.splice(at, Number.MAX_SAFE_INTEGER, ...blockIds);

    let chunkAt = Math.floor(at / chunkSize);
    let ops = [];

    for (let i = chunkAt * chunkSize; i + chunkSize < this.blockchain.length; i += chunkSize) {
      let buf = Buffer.from(this.blockchain.slice(i, i + chunkSize).join(''), 'hex');
      ops.push({ type: 'put', key: this.genKey(`chunk_${i / chunkSize}`), value: buf });
    }

    return this.store.appendBlocksAt(blocks, ops);
  }

  /**
   * Return the head block, or `undefined` when there's no
   * block on the blockchain.
   */
  async getHeadBlock() {
    let blockId = await this.store.readHeadBlock();
    return this.getBlock(blockId);
  }

  /**
   * Synchronously get current head block's id. If there is no block
   * yet, `undefined` will be returned.
   */
  getHeadBlockIdSync() {
    let length = this.blockchain.length;
    return length ? this.blockchain[length - 1] : undefined;
  }

  getBlockIdAtSync(height) {
    let curHeight = this.getCurHeightSync();
    if (height < 0 || height > curHeight) {
      throw new Error('Invalid height given.');
    }

    return this.blockchain[height];
  }

  /**
   * Note that height is 0-based (first block's height is 0).
   * If there's no block yet, `-1` will returned.
   */
  async getCurHeight() {
    let block = await this.getHeadBlock();
    return block ? block.height : -1;
  }

  /**
   * Note that height is 0-based (first block's height is 0).
   * If there's no block yet, `-1` will returned.
   */
  getCurHeightSync() {
    return this.blockchain.length - 1;
  }

  /**
   * Get a list of block locator hashes, which is used in the
   * `getBlocks` message that typically exists in blockchain
   * protocol.
   */
  getLocatorsSync() {
    let locators = [];
    let height = this.getCurHeightSync();
    let pow = 0;

    if (height === -1) { return []; }

    while (true) {
      let i = Math.max(height + 1 - Math.pow(2, pow), 0);
      locators.push(this.getBlockIdAtSync(i));
      if (i === 0) { break; }
      pow += 1;
    }
    return locators;
  }

  /**
   * Get forked branch based on locators (an array of block hashes) peer provides.
   * Return an array of block ids (from elder blocks to latest ones).
   */
  getForkedBranchSync(locators) {
    if (this.blockchain.length < locators.length) {
      return [];
    }

    let height = this.getCurHeightSync();
    if (height === -1) { return []; }
    let i = height;

    for (; i >= 0; i--) {
      let blockId = this.blockchain[i];
      if (locators.includes(blockId)) {
        break;
      }
    }

    if (i === height) { return []; }
    return this.blockchain.slice(i + 1);
  }

  /**
   * @param {*} height note that height is 0-based index
   */
  async getBlockAt(height) {
    // just to be cautious
    if (height >= this.blockchain.length) {
      throw new Error('Invalid block height.');
    }

    let blockId = this.blockchain[height];
    return this.getBlock(blockId);
  }

  /**
   * Get all blocks on the blockchain main branch.
   * At this point there is no pagination yet, so this
   * operation is very expensive.
   */
  async getBlocks(reverse = true) {
    let blocks = await Promise.all(
      this.blockchain.map(this.getBlock, this)
    );
    if (reverse) { blocks.reverse(); }
    return blocks;
  }

  /**
   * Return the whole block specified by the given block id.
   * If block doesn't exist, `undefined` will be returned.
   */
  async getBlock(blockId) {
    return this.store.readBlock(blockId);
  }

  /**
   * If the given block is not on the main blockchain, the confirmation
   * count will always be 0.
   */
  getConfirmationCntSync(blockId) {
    if (!this.onMainBranchSync(blockId)) { return null; }

    return this.getCurHeightSync() - this.blockchain.indexOf(blockId);
  }

  /**
   * Determine whether the given block is on the main blockchain branch.
   * The difference from the func `hasBlock` is that this is a synchronous
   * operation.
   */
  onMainBranchSync(blockId) {
    return this.blockchain.includes(blockId);
  }

  /**
   * By default, return true only if the given block is on the main blockchain
   * branch. If you want it to return true even if the block is off main branch,
   * set the `onMainBranch` to false.
   */
  async hasBlock(blockId, onMainBranch = true) {
    if (onMainBranch) {
      return this.blockchain.includes(blockId);
    }

    return await this.getBlock(blockId) !== undefined;
  }
}

module.exports = Blockchain;


/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

const { sliceItems } = __webpack_require__(4);
const { getCurTimestamp } = __webpack_require__(2);
const { calcMerkleRoot, verifyBlock } = __webpack_require__(0);
const {
  messageTypes, messageValidators, getData, data,
  getDataPartial, dataPartial, partialNotFound
} = __webpack_require__(5);

/**
 * Abstraction of the inventory (only for blocks) to resolve.
 */
class BlockInventory {
  /**
   * @param {*} blocks block ids
   * @param {*} slices number of slices   
   */
  constructor(blocks, slices) {
    // chain's merkle digest
    this.merkleDigest = calcMerkleRoot(blocks);
    // chunk digest (sub merkle) => chunk data
    this.chunks = {};
    // the timestamp when resolving given blocks
    this.timestamp = null;

    for (let blockIds of sliceItems(blocks, slices)) {
      let digest = calcMerkleRoot(blockIds);

      this.chunks[digest] = {
        // merkle root digest
        digest,
        // the block ids
        ids: blockIds,
        // the actual block data
        blocks: undefined,
        // the timestamp when resolving each chunk
        timestamp: undefined
      };
    }
  }

  * [Symbol.iterator]() {
    for (let chunk of Object.values(this.chunks)) {
      yield chunk;
    }
  }

  getBlocks() {
    let blockArrays = Object.values(this.chunks).map(chunk => chunk.blocks);
    let blocks = [];

    for (let array of blockArrays) {
      blocks.push(...array);
    }
    return blocks;
  }

  /**
   * Whether this block inventory is resolved (a boolean).
   */
  resolved() {
    for (let chunk of this) {
      if (!chunk.blocks) { return false; }
    }
    return true;
  }
}

/**
 * This class is an abstraction of inventory resolver, which uses
 * specific types of protocol messages (namely, `getDataPartial`, 
 * `dataPartial`, and `partialNotFound`) to enable resolving inventory
 * objects by communicating MULTIPLE peers in parallel, mainly for
 * better efficiency and scalability.
 * 
 * Resolving inventory objects here just means to convert block id or
 * message id to the actual corresponding block or message data.
 * 
 * The logic here is almost transparent to the rest of the protocol
 * implementation, except you have to call the interface exposed here
 * if you want to optionally jump in the performance & scalability
 * optimization provided by this class.
 * 
 * Note that the resolved blocks will only go through some basic
 * veriffication - more specificlly, to be individually verified.
 * Since this is mostly transparent to other modules, all existing
 * verificaitions afterwards will be invoked automatically.
 * 
 * TODO move handlers to somewhere else (resolv-handler.js)
 */
class InventoryResolver {
  /**
   * @param {*} socket        the peer whose inventory needs to resolve
   * @param {*} liteprotocol  the protocol implementation itself
   * @param {*} options
   *                `slices`  number of slices
   *        `blockThreshold`  the length threshold for sub blockchain. When
   *                          sub blockchain's length is less than this
   *                          threshold, the resolving will fall back
   *                          to original approach (only by communicating one
   *                          peer), which is via the `getData` message type.
   *                          By default, this is undefined - always using
   *                          parallel resolving.
   */
  constructor(peer, liteprotocol, { slices = 16, blockThreshold } = {}) {
    this.peerDisconnectHandler = this.peerDisconnectHandler.bind(this);
    this.getDataPartialHandler = this.getDataPartialHandler.bind(this);
    this.dataPartialHandler = this.dataPartialHandler.bind(this);
    this.partialNotFoundHandler = this.partialNotFoundHandler.bind(this);

    this.peer = peer;
    this.node = liteprotocol.node;
    this.litenode = liteprotocol.litenode;
    this.blockchain = liteprotocol.blockchain;
    this.slices = slices;
    this.blockThreshold = blockThreshold || 1;

    // merkle digest => block inventory to resolve
    this.blockInventories = {};

    this.litenode.on(`message/${messageTypes.getDataPartial}`, this.getDataPartialHandler);
    this.litenode.on(`message/${messageTypes.dataPartial}`, this.dataPartialHandler);
    this.litenode.on(`message/${messageTypes.partialNotFound}`, this.partialNotFoundHandler);
  }

  _resolveBlocks(blocks) {
    if (blocks.length < this.blockThreshold) {
      this.peer.sendJson(getData({ blocks }));
    }

    let blockInv = new BlockInventory(blocks, this.slices);
    let chunks = [...blockInv];
    let peers = this.node.peers('full');

    if (this.blockInventories[ blockInv.merkleDigest ]) {
      return;
    }

    // using round robin across peers
    for (let i = 0; i < chunks.length; i++) {
      // make sure request the last (latest) chunk
      // from the peer which is the owner of the 
      // inventory to be resolved here (because
      // other peers might not have the latest
      // blocks of the chunk just mined)
      let peer = i + 1 === chunks.length ?
        this.peer : peers[i % peers.length];

      peer.sendJson(
        getDataPartial({
          merkleDigest: blockInv.merkleDigest, 
          blocks: chunks[i].ids
        })
      ); // end of sendJson

      chunks[i].timestamp = getCurTimestamp();
      chunks[i].peer = peer;
    } // end of loop
    
    this.blockInventories[ blockInv.merkleDigest ] = blockInv;
  }

  _resolveLitemsgs(litemsgs) {
    this.peer.sendJson(getData({ litemsgs }));
  }

  /**
   * Note you don't have to provide the exact raw `inv` message
   * here, but just an `inv`-like object. An `inv`-like object
   * is any object which has either `blocks` or `litemsgs`
   * properties, or both to resolve.
   * 
   * @param {*} inv an `inv`-like object here
   */
  resolve({ blocks = [], litemsgs = [] }) {
    if (blocks.length) {
      this._resolveBlocks(blocks);
    }
    if (litemsgs.length) {
      this._resolveLitemsgs(litemsgs);
    }
  }

  async getDataPartialHandler({ messageType, ...payload }, peer) {
    if (peer.uuid !== this.peer.uuid) { return; }

    try {
      messageValidators[messageType](payload);
      let { merkleDigest, blocks: blockIds } = payload;
      let blocks = await Promise.all(
        blockIds.map(id => this.blockchain.getBlock(id))
      );

      if (blocks.some(block => !block)) {
        peer.sendJson(
          partialNotFound({
            merkleDigest, 
            blocks: blockIds
          })
        ); // end of sendJson

      } else {
        peer.sendJson(
          dataPartial({
            merkleDigest,
            blocks
          })
        ); // end of sendJson
      } // end of else

    } catch (err) {
      console.warn(err);
    }
  }

  async dataPartialHandler({ messageType, ...payload }, peer) {
    try {
      messageValidators[messageType](payload);
      let { merkleDigest, blocks } = payload;
      let blockInv = this.blockInventories[merkleDigest];
      if (!blockInv) { return; }

      blocks.filter(block => verifyBlock(block));
      let blockIds = blocks.map(block => block.hash);
      let chunk = blockInv.chunks[calcMerkleRoot(blockIds)];
      if (!chunk || chunk.blocks) { return; }

      // save block data to inventory
      chunk.blocks = blocks;

      if (blockInv.resolved()) {
        this.litenode.emit(
          `message/${messageTypes.data}`, 
          data({ blocks: blockInv.getBlocks() }),
          this.peer
        );

        delete this.blockInventories[merkleDigest];
      }

    } catch (err) {
      console.warn(err);
    }
  }

  async partialNotFoundHandler({ messageType, ...payload }, peer) {
    if (peer.uuid !== this.peer.uuid) { return; }
  }

  peerDisconnectHandler() {
    // TODO
  }

  /**
   * Do the cleanup.
   */
  close() {
    // TODO
  }
}

module.exports = InventoryResolver;


/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

const http = __webpack_require__(38);
const express = __webpack_require__(39);
const logger = __webpack_require__(40);
const cookieParser = __webpack_require__(41);
const bodyParser = __webpack_require__(42);
const { isValidJson, parseChunk } = __webpack_require__(4);

const notfoundPayload = { 'not-found': true };

/**
 * filter log entries
 */
function logFilter(logs, { peer, dir, type, since }) {
  return logs.filter(log => (
    (!peer || log.peer.startsWith(peer))
    && (!dir || log.dir.startsWith(dir))
    && (!type || log.msg.messageType.startsWith(type))
    && (!since || log.time > since)
  ));
}

/**
 * create a very minimalist rest server for debugging
 */
function createRestServer(liteProtocol) {
  const app = express();
  const node = liteProtocol.node;
  const litenode = liteProtocol.litenode;
  const blockchain = liteProtocol.blockchain;
  const liteStore = liteProtocol.liteStore;
  const leveldb = liteProtocol.liteStore.db;

  app.use(logger('dev'));
  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.get('/', (req, res) => {
    res.status(200).json({
      endpoints: [
        { '/info': 'all sorts of info about this node' },
        { '/peers': 'peer information' },
        { '/msgpool': 'pending litemessage pool' },
        { '/blocks': 'get all blocks on the main branch' },
        { '/blocks/:blockId': 'get specified block' },
        { '/litemsgs/:litemsgId': 'get a litemessage\'s info on blockchain' },
        { '/logs': 'protocol message logs' },
        { '/litedb/:key': 'fetch any leveldb value of a given key' },
        { '/locators': 'get the block locator hashes' }
      ]
    });
  });

  app.get('/info', (req, res) => {
    res.status(200).json(litenode.getInfo());
  });

  app.get('/peers', (req, res) => {
    let { type } = req.query;
    res.status(200).json(node.peers(type));
  });

  app.get('/msgpool', (req, res) => {
    res.status(200).json(liteProtocol.litemsgPool);
  });

  app.get('/blocks', async (req, res) => {
    let blocks = await blockchain.getBlocks();

    let { simple } = req.query;
    if (simple && simple.toLowerCase() === 'true') {
      blocks = blocks.map(block => ({ [block.height]: block.hash }));
    }

    res.status(200).json(blocks);
  });

  app.get('/blocks/:blockId', async (req, res, next) => {
    try {
      let { blockId } = req.params;
      let block = await liteProtocol.blockchain.getBlock(blockId);

      if (block) {
        res.status(200).json(block);
      } else {
        res.status(404).json(notfoundPayload);
      }

    } catch (err) {
      next(err);
    }
  });

  app.get('/litemsgs/:litemsgId', async (req, res, next) => {
    try {
      let { litemsgId } = req.params;
      let at = await liteStore.readLitemsg(litemsgId);

      if (typeof at === 'undefined') {
        res.status(404).json(notfoundPayload);
        return;
      }

      let mainBranch = blockchain.onMainBranchSync(at);
      let confirmation = mainBranch ?
        blockchain.getConfirmationCntSync(at) :
        'N/A';
      
      res.status(200).json({ at, mainBranch, confirmation });

    } catch (err) {
      next(err);
    }
  });

  app.get('/logs', (req, res) => {
    let logs = liteProtocol.litenode.messageLogs;
    let { peer, dir, type, since } = req.query;
    if (typeof since === 'string') {
      since = parseInt(since);
    }

    res.status(200).json(logFilter(logs, { peer, dir, type, since }));
  });

  app.get('/litedb/:key', async (req, res, next) => {
    try {
      let { key } = req.params;
      let buf = await leveldb.get('lite/' + key);
      let str = key.startsWith('chunk_') ?
        JSON.stringify(parseChunk(buf)) :
        buf.toString();

      let payload = isValidJson(str) ? JSON.parse(str) : { _$: str };
      res.status(200).json(payload);

    } catch (err) {
      if (err.notFound) {
        res.status(404).json(notfoundPayload);
      } else {
        next(err);
      }
    }
  });

  app.get('/locators', (req, res) => {
    let locators = blockchain.getLocatorsSync();
    res.status(200).json(locators);
  });

  return http.createServer(app);
}

module.exports = createRestServer;


/***/ }),
/* 38 */
/***/ (function(module, exports) {

module.exports = require("http");

/***/ }),
/* 39 */
/***/ (function(module, exports) {

module.exports = require("express");

/***/ }),
/* 40 */
/***/ (function(module, exports) {

module.exports = require("morgan");

/***/ }),
/* 41 */
/***/ (function(module, exports) {

module.exports = require("cookie-parser");

/***/ }),
/* 42 */
/***/ (function(module, exports) {

module.exports = require("body-parser");

/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

const { sha256 } = __webpack_require__(0);

/**
 * @param {string} ver      version number (now hardcoded to 1, I don't have time :|)
 * @param {int} time        timestamp (unix time)
 * @param {string} litemsg  litemessage itself
 * @param {string} sig      signature
 * @param {string} pubKey   public key
 */
const createLitemsg = (ver, time, litemsg, sig, pubKey) => {
  let hash = sha256(`${ver}${time}${litemsg}${sig}${pubKey}`);
  return { ver, time, litemsg, sig, pubKey, hash };
};

module.exports = createLitemsg;


/***/ })
/******/ ]);
//# sourceMappingURL=index.js.map
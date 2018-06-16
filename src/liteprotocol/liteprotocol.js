const P2PProtocol = require('../p2pprotocol/p2protocol');
const LiteProtocolStore = require('./store');
const Miner = require('./miner');
const Blockchain = require('../utils/blockchain');
const createRestServer = require('./rest');
const createBlock = require('./entities/block');
const {
  messageTypes, messageValidators, getBlocks, 
  inv, getData, data, getPendingMsgs
} = require('./messages');
const { validateBlock, validateLitemsg } = require('../utils/litecrypto');
const { pickItems } = require('../utils/common');
const { calcMerkleRoot } = require('../utils/merkle');
const { getCurTimestamp } = require('../utils/time');

const ver = 1;
const bits = 22;
const blockLimit = 2048;

class LiteProtocol extends P2PProtocol {
  static get ver() {
    return ver;
  }

  constructor(node, nodeTypes, { minPeerNum = 8 } = {}) {
    super(node, nodeTypes, { minPeerNum });
    this.getBlocksHandler = this.getBlocksHandler.bind(this);
    this.invHandler = this.invHandler.bind(this);
    this.getDataHandler = this.getDataHandler.bind(this);
    this.dataHandler = this.dataHandler.bind(this);
    this.getPendingMsgsHandler = this.getPendingMsgsHandler.bind(this);
    this.connectionHandler = this.connectionHandler.bind(this);

    this.liteStore = new LiteProtocolStore(node.db);
    // a blockchain manager
    this.blockchain = new Blockchain(this.liteStore);
    this.miner = new Miner();
    // map litemessage id to litemessage itself (pending litemessages)
    this.litemsgPool = {};

    // wait for blockchain initializing itself
    this.blockchain.on('ready', () => { this.init() });

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
    this.litenode.on('connection', this.connectionHandler);

    // create and run rest server
    createRestServer(this).listen(this.node.port + 1);

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
  }

  async getNextBlock() {
    let time = getCurTimestamp();
    let litemsgs = pickItems(Object.values(this.litemsgPool), blockLimit);
    let merkleRoot = calcMerkleRoot(litemsgs.map(m => m.hash));
    let { 
      height = -1, hash: prevBlock = undefined 
    } = await this.blockchain.getHeadBlock() || {};
    height += 1;
    
    return createBlock(ver, time, height, prevBlock, merkleRoot, bits, undefined, litemsgs);
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

  async hasBlock(blockId) {
    // TODO
  }

  async getBlocksHandler({ messageType, ...payload }, peer) {
    // TODO
  }

  async invHandler({ messageType, ...payload }, peer) {
    try {
      messageValidators[messageType](payload);
      let { blocks, litemsgs } = payload;
      let blocksToGet = [];
      let litemsgsToGet = [];

      for (let litemsgId of litemsgs) {
        if (!(await this.hasLitemsg(litemsgId))) {
          litemsgsToGet.push(litemsgId);
        }
      }

      if (blocksToGet.length || litemsgsToGet.length) {
        // send response
        peer.sendJson(getData({ litemsgs: litemsgsToGet }));
      }

    } catch (err) {
      console.warn(err);
    }
  }

  async getDataHandler({ messageType, ...payload }, peer) {
    try {
      messageValidators[messageType](payload);
      let { blocks, litemsgs } = payload;
      let respBlock = [];
      let respLitemsgs = [];

      for (let litemsgId of litemsgs) {
        // NOTE: only return litemessages from pool for `getData`
        let litemsg = this.litemsgPool[litemsgId];
        if (litemsg) { respLitemsgs.push(litemsg); }
      }

      if (respBlock.length || respLitemsgs.length) {
        // send response
        peer.sendJson(data({ litemsgs: respLitemsgs }));
      }

    } catch (err) {
      console.warn(err);
    }
  }

  async dataHandler({ messageType, ...payload }, peer) {
    try {
      messageValidators[messageType](payload);
      let { blocks, litemsgs } = payload;
      let relayBlocks = [];
      let relayLitemsgs = [];

      // filter out invalid
      // TODO need previous block
      blocks = blocks.filter(validateBlock);
      litemsgs = litemsgs.filter(validateLitemsg);

      for (let litemsg of litemsgs) {
        if (await this.hasLitemsg(litemsg.hash)) { continue; }

        relayLitemsgs.push(litemsg.hash);
        this.litemsgPool[litemsg.hash] = litemsg;
      }

      if (relayBlocks.length || relayLitemsgs.length) {
        // relay (broadcast) data messaage
        this.litenode.broadcastJson(
          inv({ litemsgs: relayLitemsgs }),
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

  connectionHandler(peer) {
    // TODO
  }

  close() {
    for (let timer of this.timers) {
      clearInterval(timer);
    }
    super.close();
  }
}

module.exports = LiteProtocol;

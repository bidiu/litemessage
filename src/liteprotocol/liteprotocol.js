const P2PProtocol = require('../p2pprotocol/p2protocol');
const LiteProtocolStore = require('./store');
const Miner = require('./miner');
const createRestServer = require('./rest');
const {
  messageTypes, messageValidators, getBlocks, inv, getData, data,
  getPendingMsgs
} = require('./messages');
const { validateBlock, validateLitemsg } = require('../utils/litecrypto');
const { pickItems } = require('../utils/common');

const ver = 1;
const difficulty = 22;

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
    this.miner = new Miner(difficulty);
    // map litemessage id to litemessage itself (pending litemessages)
    this.litemsgPool = {};

    // register message/connection handlers
    this.litenode.on(`message/${messageTypes.getBlocks}`, this.getBlocksHandler);
    this.litenode.on(`message/${messageTypes.inv}`, this.invHandler);
    this.litenode.on(`message/${messageTypes.getData}`, this.getDataHandler);
    this.litenode.on(`message/${messageTypes.data}`, this.dataHandler);
    this.litenode.on(`message/${messageTypes.getPendingMsgs}`, this.getPendingMsgsHandler);
    this.litenode.on('connection', this.connectionHandler);

    // recover state from db
    this.headBlock = this.liteStore.readHeadBlock();

    // create and run rest server
    createRestServer(this).listen(node.port + 1);

    // this.msgPoolTimer = setInterval(() => {
    //   if (Object.entries(this.litemsgPool).length > 0) { return; }
    //   try {
    //     pickItems(node.peers('full'), 8)
    //       .forEach(peer => peer.sendJson(getPendingMsgs()))
    //   } catch (err) { console.warn(err); }
    // }, 30000);
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
    clearInterval(this.msgPoolTimer);
    super.close();
  }
}

module.exports = LiteProtocol;

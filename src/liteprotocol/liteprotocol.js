const P2PProtocol = require('../p2pprotocol/p2protocol');
const LiteProtocolStore = require('./store');
const Miner = require('./miner');
const Blockchain = require('../utils/blockchain');
const HandshakeManager = require('./handshake');
const createRestServer = require('./rest');
const createBlock = require('./entities/block');
const {
  messageTypes, messageValidators, getBlocks, 
  inv, getData, data, getPendingMsgs
} = require('./messages');
const {
  verifyBlock, verifyLitemsg, calcMerkleRoot, verifySubchain
} = require('../utils/litecrypto');
const { pickItems } = require('../utils/common');
const { getCurTimestamp } = require('../utils/time');

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

    // create and run rest server
    createRestServer(this).listen(this.litenode.daemonPort + 1);

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
      let { blocks, litemsgs } = payload;
      let blocksToGet = [];
      let litemsgsToGet = [];

      // filter out blocks already have 
      // blocks off main branch also as being haven
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
        // send response
        peer.sendJson(
          getData({ blocks: blocksToGet, litemsgs: litemsgsToGet })
        );
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
      let blockLocators = this.blockchain.getLocatorsSync();
      peer.sendJson(getBlocks({ blockLocators }));
    }
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

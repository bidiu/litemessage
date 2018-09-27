const P2PProtocol = require('../p2pprotocol/p2protocol');
const LiteProtocolStore = require('./store');
const HandshakeManager = require('./handshake');
const Blockchain = require('../utils/blockchain');
const {
  verifyHeader, verifyHeaderChain
} = require('../utils/litecrypto');
const {
  messageTypes, messageValidators, getHeaders, getBlocks
} = require('./messages');

if (BUILD_TARGET === 'node') {
  // run in node
  var createRestServer = require('./rest');
} else {
  // run in browser
}

// protocol version
const VERSION = 1;
// node types to re/connect automatically
const AUTO_CONN_NODE_TYPES = ['full'];

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
  static get ver() {
    return VERSION;
  }

  constructor(node) {
    super(node, { nodeTypes: AUTO_CONN_NODE_TYPES });
    this.invHandler = this.invHandler.bind(this);
    this.headersHandler = this.headersHandler.bind(this);
    this.peerConnectHandler = this.peerConnectHandler.bind(this);

    this.litestore = new LiteProtocolStore(node.db);
    // a blockchain manager
    this.blockchain = new Blockchain(this.litestore);

    // wait for blockchain initializing itself
    this.blockchain.on('ready', () => this.init());
    // or upon error
    this.blockchain.on('error', err => {
      console.error(err);
      process.exit(1);
    });
  }

  init() {
    // register message/connection handlers
    this.litenode.on(`message/${messageTypes.inv}`, this.invHandler);
    this.litenode.on(`message/${messageTypes.headers}`, this.headersHandler);
    this.litenode.on('peerconnect', this.peerConnectHandler);

    this.handshake = new HandshakeManager(this);

    if (this.litenode.debug && BUILD_TARGET === 'node') {
      // create and run rest server
      let debugPort = this.litenode.debugPort;
      createRestServer(this).listen(debugPort);
      console.log(`Debugging RESTful API server listening on port ${debugPort}.`);
    }

    // protocol handling setup is ready now
    this.emit('ready');
  }

  /**
   * If the given litemessage id is in LevelDB's litemessage index.
   */
  async hasLitemsg(litemsgId) {
    return await this.litestore.hasLitemsg(litemsgId);
  }

  async invHandler({ messageType, ...payload }, peer) {
    try {
      messageValidators[messageType](payload);
      // Note the "blocks" here either is a single block just
      // mined by peer, or is a sub blockchain, which, in
      // other words, means those blocks are consecutive.
      // This is just due to how the protocol is designed.
      let { blocks } = payload;
      let blocksToGet = [];

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

      if (blocksToGet.length) {
        peer.sendJson(
          getHeaders({ blocks: blocksToGet })
        );
      }

    } catch (err) {
      console.warn(err);
    }
  }

  async headersHandler({ messageType, ...payload }, peer) {
    try {
      messageValidators[messageType](payload);
      // `blocks` is only header (don't have body)
      let { blocks } = payload;

      // filter out invalid blocks (headers)
      blocks = blocks.filter(block => verifyHeader(block));
      blocks.sort((a, b) => a.height - b.height);

      let headBlockId = this.blockchain.getHeadBlockIdSync();

      if (blocks.length && blocks[blocks.length - 1].height > this.blockchain.getCurHeightSync()) {
        if (blocks.length === 1) {
          let block = blocks[0];

          if (block.prevBlock === headBlockId) {
            this.blockchain.append(block);
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

          if (verifyHeaderChain(blocks, prevBlock)) {
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
              // switch the blockchain to another branch,
              // for efficiency, don't await it finishing
              // (no await here)
              this.blockchain.appendAt([...extendedBlocks, ...blocks]);
            }
          }
        }
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
      }, 20000);
    }

    // TODO
    // peer._resolver = new InventoryResolver(peer, this);
  }

  close() {
    this.handshake.close();
    super.close();
  }
}

module.exports = ThinLiteProtocol;

const { sliceItems } = require('../utils/common');
const { getCurTimestamp } = require('../utils/time');
const { calcMerkleRoot, verifyBlock } = require('../utils/litecrypto');
const {
  messageTypes, messageValidators, getData, data,
  getDataPartial
} = require('./messages');

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

const EventEmitter = require('events');

/**
 * A chunk is a fixed number of consecutive blocks (only block id) grouped
 * together stored in LevelDB in binary formay (not in hex encode), mainly
 * for efficiency.
 * 
 * NOTE that once a block is stored in LevelDB, you should NEVER change this
 * constant down below.
 */
const chunkSize = 4;

/**
 * This is a very low level abstraction of a blockchain, which needs to be 
 * injected with an store (LevelDB) interface implementation for interacting
 * with LevelDB. Take `LiteProtocol` as an example.
 * 
 * This blockchain abstraction here should be protocol-agnostic.
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
   */
  async appendAt(blocks) {
    // TODO chunks
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

  async hasBlock(blockId, inMainBranch = true) {
    if (inMainBranch) {
      return this.blockchain.includes(blockId);
    }

    return await this.getBlock(blockId) !== undefined;
  }
}

module.exports = Blockchain;

const EventEmitter = require('events');

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
 * 
 * Emitted events:
 * - `ready`    when underlying blockchain is initialized
 * - `error`    opposite of `ready`
 * - `push`     when a newly mined block is pushed into blockchain
 * - `switch`   when a subchain (either off or on main brnach) is appended
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
    const prevHead = this.getHeadBlockIdSync();
    const ops = [];
    this.blockchain.push(block.hash);
    let height = this.getCurHeightSync();

    if ((height + 1) % chunkSize === 0) {
      const serialNum = Math.floor((height + 1) / chunkSize) - 1;
      const buf = Buffer.from(this.blockchain.slice(height + 1 - chunkSize).join(''), 'hex');
      ops.push({ type: 'put', key: this.genKey(`chunk_${serialNum}`), value: buf });
    }

    return this.store.appendBlock(block, ops)
      .then(() => this.emit('push', block, prevHead));
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

    let prevHead = this.getHeadBlockIdSync();
    let at = blocks[0].height;
    let blockIds = blocks.map(block => block.hash);
    let offBlockIds = this.blockchain.splice(at, Number.MAX_SAFE_INTEGER, ...blockIds);

    let chunkAt = Math.floor(at / chunkSize);
    let ops = [];

    for (let i = chunkAt * chunkSize; i + chunkSize < this.blockchain.length; i += chunkSize) {
      let buf = Buffer.from(this.blockchain.slice(i, i + chunkSize).join(''), 'hex');
      ops.push({ type: 'put', key: this.genKey(`chunk_${i / chunkSize}`), value: buf });
    }

    // append the new branch
    await this.store.appendBlocksAt(blocks, ops);

    // following removes stale litemessage indices
    let offBlocks = await Promise.all(
      offBlockIds.map(id => this.getBlock(id))
    );
    let offLitemsgs = [];

    for (let block of offBlocks) {
      if (block.litemsgs) {
        offLitemsgs.push(...block.litemsgs);
      }
    }
    await Promise.all(
      offLitemsgs.map(async ({ hash }) => {
        let blockId = await this.store.readLitemsg(hash);

        if (!this.onMainBranchSync(blockId)) {
          return this.store.removeLitemsg(hash);
        }
      })
    );

    this.emit('switch', blocks, prevHead);
    // resolve nothing when success
    // reject with error when error
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
   * This method is a helper to help scroll along the 
   * blockchain (pagination) from newer blocks to older 
   * ones.
   * 
   * It gets a sub blockchain with specified length ending
   * at the given block id (exclusive).
   * 
   * Both parameters are optional. If you don't pass
   * `until` (or you pass a nonexistent block id), it 
   * will return until the head block (inclusive in this
   * case).
   * 
   * @param {*} until the last block id (exclusive)
   * @param {*} len   length of the blockchain
   */
  async getSubBlockchain(until, len = 100) {
    let i = this.blockchain.indexOf(until);
    let hashes = i < 0 ? this.blockchain.slice(-len) :
      this.blockchain.slice(Math.max(0, i - len), i);

    return Promise.all( hashes.map(this.getBlock, this) );
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

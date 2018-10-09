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

  async removeLitemsg(litemsgId) {
    return this.db.del(genKey(`litemsg_${litemsgId}`));
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

  /**
   * If the given litemessage is off main branch, this method
   * will still return true.
   */
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

  /**
   * Blocks are meant to be immutable. Make sure use this operation
   * with caution - you could potentially corrupt the blockchain.
   */
  async writeBlock(block, batchOps) {
    if (typeof block.hash !== 'string') {
      throw new Error('Invalid block hash.');
    }

    let ops = [
      { type: 'put', key: genKey(`block_${block.hash}`), value: JSON.stringify(block) }
    ];
    if (block.litemsgs) {
      for (let litemsg of block.litemsgs) {
        ops.push({ type: 'put', key: genKey(`litemsg_${litemsg.hash}`), value: block.hash });
      }
    }
    if (batchOps) {
      ops = [...ops, ...batchOps];
    }

    return this.db.batch(ops);
  }

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
    if (block.litemsgs) {
      for (let litemsg of block.litemsgs) {
        ops.push({ type: 'put', key: genKey(`litemsg_${litemsg.hash}`), value: block.hash });
      }
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
      if (block.litemsgs) {
        for (let litemsg of block.litemsgs) {
          ops.push({ type: 'put', key: genKey(`litemsg_${litemsg.hash}`), value: block.hash });
        }
      }
    }
    ops.push({ type: 'put', key: genKey('head_block'), value: headBlock.hash });

    if (batchOps) { ops = [...ops, ...batchOps]; }

    return this.db.batch(ops);
  }
}

module.exports = LiteProtocolStore;

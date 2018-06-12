const prefix = 'lite/';

const genKey = key => prefix + key;

class LiteProtocolStore {
  constructor(db) {
    this.db = db;
  }

  /**
   * return the head hash id
   */
  async readHeadBlock() {
    try {
      let buf = await this.db.get(genKey('head_block'));
      return JSON.parse(buf.toString());
    } catch (err) {
      if (err.notFound) { return undefined; }
      throw err;
    }
  }

  async writeHeadBlock(blockId) {
    return this.db.put(genKey('head_block'), blockId);
  }

  async readBlock(blockId) {
    try {
      let buf = await this.db.get(genKey(`block_${blockId}`));
      return JSON.parse(buf.toString());
    } catch (err) {
      if (err.notFound) { return undefined; }
      throw err;
    }
  }

  async writeBlock(block) {
    if (typeof block.hash !== 'string') {
      throw new Error('Invalid block hash.');
    }
    return this.db.put(genKey(`block_${block.hash}`), block);
  }

  async readLitemsg(litemsgId) {
    try {
      let buf = await this.db.get(genKey(`litemsg_${litemsgId}`));
      return JSON.parse(buf.toString());
    } catch (err) {
      if (err.notFound) { return undefined; }
      throw err;
    }
  }

  async hasLitemsg(litemsgId) {
    return (await this.readLitemsg(litemsgId)) !== undefined;
  }

  /**
   * TODO might change this: we don't need to have index for litemessages?
   * might just litemessage's location index (in which block).
   */
  async writeLitemsg(litemsg) {
    if (typeof litemsg.hash !== 'string') {
      throw new Error('Invalid litemessage hash.');
    }
    return this.db.put(genKey(`litemsg_${litemsg.hash}`), litemsg);
  }
}

module.exports = LiteProtocolStore;

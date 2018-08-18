import { mine } from '../utils/litecrypto';
import createBlock from './entities/block';

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

export default Miner;

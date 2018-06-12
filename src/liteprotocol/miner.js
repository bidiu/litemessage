const { mine } = require('../utils/litecrypto');

/**
 * mining manager
 */
class Miner {
  /**
   * @param {int} difficulty also called `bits`
   */
  constructor(difficulty) {
    this.difficulty = difficulty;
  }

  /**
   * Start mining. If at the point you call this function,
   * a mining is going on, that mining will be canceled
   * automatically.
   * 
   * You pass a callback, which will be called with mined
   * nonce. If the mining is canceled before mining the
   * nonce successfully, callback won't be invoked.
   */
  start(content, callback) {
    if (this.mining) { this.cancel(); }
    this.mining = mine(content, this.difficulty);
    this.mining
      .then(nonce => {
        this.mining = null;
        callback(undefined, nonce);
      })
      .catch(err => {
        this.mining = null;
        callback(err);
      });
  }

  cancel() {
    this.mining.cancel();
    this.mining = null;
  }
}

module.exports = Miner;

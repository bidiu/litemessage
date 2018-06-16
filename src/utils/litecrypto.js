const { fork } = require('child_process');
const crypto = require('crypto');
const path = require('path');
const Promise = require('bluebird');

Promise.config({
  // enable warnings
  warnings: true,
  // enable long stack traces
  longStackTraces: true,
  //enable cancellation
  cancellation: true
});

const sha256 = (content, digest = 'hex') => {
  return crypto.createHash('sha256')
    .update(content)
    .digest(digest);
};

const mine = (content, difficulty) => 
  new Promise((resolve, reject, onCancel) => {
    if (typeof difficulty !== 'number') { reject(new Error('Invalid difficulty.')); }
    let cp = fork(path.join(__dirname, '../liteprotocol/mine.js'), [content, difficulty]);

    let timer = setTimeout(() => {
      cp.removeAllListeners();
      cp.kill('SIGTERM');
      reject(new Error('Mining timeouts.'));
    }, 600000);

    cp.on('message', (nonce) => {
      clearTimeout(timer);
      resolve(nonce);
    });
   
    onCancel(() => {
      clearTimeout(timer);
      cp.removeAllListeners();
      cp.kill('SIGTERM');
    });
  });

  /**
   * TODO validate timestamp, sig, pubKey
   * For timestamp, need to consider how long it takes to
   * populate the network.
   */
const validateLitemsg = (litemessage) => {
  let { ver, time, litemsg, sig, pubKey, hash } = litemessage;

  if (typeof ver !== 'number') {
    return false;
  }
  if (typeof time !== 'number') {
    return false;
  }
  if (typeof litemsg !== 'string') {
    return false;
  }
  if (hash !== sha256(`${ver}${time}${litemsg}${sig}${pubKey}`)) {
    return false;
  }
  return true;
};

/**
 * validation of genesis block should be different from other blocks
 * 
 * TODO different prevBLock doesn't mean the block must be invalid -
 * maybe this node is off main branch.
 */
const validateBlock = (block, prevBlock) => {
  // TODO
};

exports.sha256 = sha256;
exports.mine = mine;
exports.validateLitemsg = validateLitemsg;
exports.validateBlock = validateBlock;

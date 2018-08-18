if (BUILD_TARGET === 'node') {
  // node

  var path = require('path');
  var crypto = require('crypto');
  var { fork } = require('child_process');
  var Promise = require('bluebird');

  Promise.config({
    // enable warnings
    warnings: true,
    // enable long stack traces
    longStackTraces: true,
    //enable cancellation
    cancellation: true
  });

} else {
  // browser

  var sha256 = require('js-sha256');
  var Buffer = require('buffer/').Buffer;
}

// ********************* requiring ends *********************

const maskTable = Object.freeze([
  0x80, 
  0x40, 
  0x20,
  0x10,
  0x08,
  0x04,
  0x02,
  0x01
]);

if (BUILD_TARGET === 'node') {
  // node

  var sha256 = (content, digest = 'hex') => 
    crypto.createHash('sha256')
      .update(content)
      .digest(digest);

  var mine = (content, difficulty) => 
    new Promise((resolve, reject, onCancel) => {
      if (typeof difficulty !== 'number') { reject(new Error('Invalid difficulty.')); }
      let cp = fork(path.join(__dirname, 'mine.js'), [content, difficulty]);
  
      let timer = setTimeout(() => {
        cp.removeAllListeners();
        cp.kill('SIGTERM');
        reject(new Error('Mining timeouts.'));
  
        // disable timeout in production
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

} else {
  // browser

  // nothing here
}

/**
 * @param {Array<string>} leaves  list of litemessage ids
 */
const calcMerkleRoot = (leaves) => {
  if (leaves.length === 0) {
    throw new Error('Cannot calcuate merkle root from 0 leaf.');
  }
  if (leaves.length % 2 === 1) {
    leaves = [...leaves, leaves[leaves.length - 1]]
  }
  let innerNodes = [];
  for (let i = 0; i < leaves.length; i += 2) {
    innerNodes.push(sha256(`${leaves[i]}${leaves[i + 1]}`));
  }
  if (innerNodes.length === 1) {
    return innerNodes[0];
  }
  return calcMerkleRoot(innerNodes);
}

/**
 * If verification passes, `true` will be returned.
 */
const verifyMerkleRoot = (merkleRoot, leaves) => {
  return merkleRoot === calcMerkleRoot(leaves);
}

/**
 * @param {Buffer|string} buffer binary buffer or string in hex encoding
 */
const leadingZeroBits = (buffer) => {
  if (typeof buffer === 'string') {
    buffer = Buffer.from(buffer, 'hex');
  }
  let bits = 0;
  let byteAt = 0;

  for (; buffer[byteAt] === 0; byteAt++) {
    bits += 8;
  }
  for (let bitAt = 0; bitAt < 8; bitAt++) {
    if (buffer[byteAt] & maskTable[bitAt]) {
      break;
    }
    bits += 1;
  }

  return bits;
}

/**
 * TODO validate timestamp, sig, pubKey
 * For timestamp, need to consider how long it takes to
 * populate the network.
 */
const verifyLitemsg = (litemessage) => {
  if (!litemessage) { return false; }

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
 * TODO validate timestamp, bits (its value)
 * 
 * Note that if you don't pass `prevBlock`, this func won't verify `height` (though
 * it still must be a positive number) and `prevBlock` (though it still must be 
 * `undefined` when `height` is 0).
 * 
 * When verifying genesis block (the first block), you shouldn't pass `prevBlock`
 * parameter.
 * 
 * @param {*} block     the block to verify
 * @param {*} prevBlock (optional) previous block (not id), which the verified
 *                      block should be after immediately
 */
const verifyBlock = (block, prevBlock) => {
  if (!block) { return false; }

  let { ver, time, height, merkleRoot, bits, nonce, litemsgs } = block;

  if (typeof ver !== 'number') {
    return false;
  }
  if (typeof time !== 'number') {
    return false;
  }
  if (typeof height !== 'number' || height < 0 || 
    (height === 0 && typeof block.prevBlock !== 'undefined') ||
    (height !== 0 && typeof block.prevBlock === 'undefined')) {

    return false;
  }
  if (!(litemsgs instanceof Array) || !litemsgs.length) {
    return false;
  }
  if (typeof merkleRoot !== 'string' || !verifyMerkleRoot(merkleRoot, litemsgs.map(m => m.hash))) {
    return false;
  }
  
  /* bits, nonce, hash */
  if (typeof bits !== 'number'|| typeof nonce !== 'number'
    || nonce < 0 || typeof block.hash !== 'string') {
    
    return false;
  }
  let hash = sha256(`${ver}${time}${height}${block.prevBlock}${merkleRoot}${bits}${nonce}`);
  if (hash !== block.hash || leadingZeroBits(hash) < bits) {
    return false;
  }

  /* litemsgs */
  for (let litemsg of litemsgs) {
    if (!verifyLitemsg(litemsg)) { return false; }
  }

  /* height, prevBlock */
  if (typeof prevBlock !== 'undefined') {
    if (typeof block.prevBlock !== 'string' || prevBlock.hash !== block.prevBlock) {
      return false;
    }

    if (prevBlock.height + 1 !== height) { return false; }
  }
  return true;
};

/**
 * Note that `subchain` start from elder blocks to newer blocks, which is a
 * block array.
 * 
 * Parameter `prevBlock` should always be a valid block (NEVER pass un-verified
 * blocks received from peers). Or when the subchain starts at genesis block, 
 * do not pass parameter `prevBlock` (leave it as `undefined`).
 */
const verifySubchain = (subchain, prevBlock) => {
  for (let block of subchain) {
    if (!verifyBlock(block, prevBlock)) {
      return false;
    }
    prevBlock = block;
  }
  return true;
};

exports.sha256 = sha256;
exports.calcMerkleRoot = calcMerkleRoot;
exports.verifyMerkleRoot = verifyMerkleRoot;
exports.leadingZeroBits = leadingZeroBits;
exports.verifyLitemsg = verifyLitemsg;
exports.verifyBlock = verifyBlock;
exports.verifySubchain = verifySubchain;

if (BUILD_TARGET === 'node') {
  // node

  exports.mine = mine;

} else {
  // browser

  // nothing here
}

const { sha256 } = require('../../utils/litecrypto');

/**
 * Note for genesis block, its `height` must be 0, and `prevBlock` be `undefined`.
 * 
 * All fields together except `litemsgs` are called block header, while `litemsgs`
 * is called block body.
 * 
 * @param {*} ver         version number (now hardcoded to 1, I don't have time :|)
 * @param {*} time        timestamp (unix time)
 * @param {*} height
 * @param {*} prevBlock   previous block's id
 * @param {*} merkleRoot  merkle root
 * @param {*} bits        difficulty
 * @param {*} nonce       nonce
 * @param {*} litemsgs    an array of litemessages (not ids)
 */
const createBlock = (ver, time, height, prevBlock, merkleRoot, bits, nonce, litemsgs) => {
  let hash = undefined;
  if (typeof nonce === 'number') {
    // only calculate hash when `nonce` is given
    hash = sha256(`${ver}${time}${height}${prevBlock}${merkleRoot}${bits}${nonce}`);
  }
  return { ver, time, height, prevBlock, merkleRoot, bits, nonce, litemsgs, hash };
};

module.exports = createBlock;

const { sha256 } = require('../utils/litecrypto');

/**
 * @param {Array<string>} leaves  list of litemessage ids
 */
function calcMerkleRoot(leaves) {
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

exports.calcMerkleRoot = calcMerkleRoot;

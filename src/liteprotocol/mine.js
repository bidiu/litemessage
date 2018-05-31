/*
 * This module will be executed in a separate child process 
 * (the miner worker process).
 */

const { sha256 } = require('../utils/litecrypto');

/**
 * Note that this is a cpu-bound task.
 * 
 * @param {string} content      content to mine against
 * @param {number} difficulty   currently only support # of bytes (instead of bits)
 * @return                      the nonce (number)
 */
const _mine = (content, difficulty) => {
  let nonce = 0;
  while (true) {
    let buf = Buffer.from(sha256(`${nonce}${content}`), 'hex');
    let i = 0;
    for (; i < difficulty; i++) {
      if (buf[i] !== 0) { break; }
    }
    if (i === difficulty) { return nonce; }
    nonce++;
  }
};

let content = process.argv[2];
let difficulty = parseInt(process.argv[3]);

let nonce = _mine(content, difficulty);

process.send(nonce);

/*
 * This module will be executed in a separate child process 
 * (the miner worker process), because mining is a CPU-bound
 * task, which, if run in main thread, will block Node's
 * event loop.
 */

const { sha256 } = require('../utils/litecrypto');

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

/**
 * Note that this is a cpu-bound task; it should run in a
 * worker process.
 * 
 * @param {string} content      content to mine against
 * @param {number} difficulty   difficulty, # of bits of leading 0
 * @return                      the nonce/answer (a number)
 */
const _mine = (content, difficulty) => {
  let bytes = Math.floor(difficulty / 8);
  let bits = difficulty % 8;
  let nonce = 0;
  while (true) {
    let buf = Buffer.from(sha256(`${nonce}${content}`), 'hex');
    let i = 0;
    for (; i < bytes; i++) {
      if (buf[i] !== 0) { break; }
    }
    if (i !== bytes) {
      nonce++;
      continue;
    }
    let j = 0;
    for (; j < bits; j++) {
      if (!!(buf[i] & maskTable[j])) {
        break;
      }
    }
    if (j === bits) { return nonce; }
    nonce++;
  }
};

let content = process.argv[2];
let difficulty = parseInt(process.argv[3]);

let nonce = _mine(content, difficulty);

process.send(nonce);

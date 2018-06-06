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
    }, 120000);

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

exports.sha256 = sha256;
exports.mine = mine;

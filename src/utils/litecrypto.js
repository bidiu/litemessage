const { fork } = require('child_process');
const crypto = require('crypto');
const path = require('path');

const sha256 = (content, digest = 'hex') => {
  return crypto.createHash('sha256')
    .update(content)
    .digest(digest);
};

const mine = (content, difficulty) => 
  new Promise((resolve, reject) => {
    if (typeof difficulty !== 'number') { reject(new Error('Invalid difficulty.')); }
    let cp = fork(path.join(__dirname, '../liteprotocol/mine.js'), [content, difficulty]);

    let timer = setTimeout(() => {
      cp.removeAllListeners('message');
      cp.kill('SIGTERM');
      reject(new Error('Mining timeouts.'));
    }, 120000);

    cp.on('message', (nonce) => {
      clearTimeout(timer);
      resolve(nonce);
    });
  });

exports.sha256 = sha256;
exports.mine = mine;

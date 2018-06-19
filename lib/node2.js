const LiteProtocol = require('./liteprotocol/liteprotocol');
const FullNode = require('./fullnode');
const path = require('path');
const { getAbsRootPath } = require('./utils/common');

const dbPath = path.join(getAbsRootPath(), 'db_2');
const initPeerUrls = [
  'ws://localhost:1113',
  // 'ws://localhost:3113'
];

const node = new FullNode(LiteProtocol, dbPath, { port: 2113, initPeerUrls });
// const node2 = new FullNode(LiteProtocol, dbPath, { port: 3113, initPeerUrls });


process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

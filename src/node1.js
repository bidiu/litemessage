const P2PProtocol = require('./p2pprotocol/p2protocol');
const FullNode = require('./fullnode');
const path = require('path');
const { getAbsRootPath } = require('./utils/common');

const dbPath = path.join(getAbsRootPath(), 'db_1');

const node = new FullNode(P2PProtocol, dbPath, { port: 1113 });

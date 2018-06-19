const LiteProtocol = require('./liteprotocol/liteprotocol');
const FullNode = require('./fullnode');
const path = require('path');
const { getAbsRootPath } = require('./utils/common');

const dbPath = path.join(getAbsRootPath(), 'db_1');

const node = new FullNode(LiteProtocol, dbPath, { port: 1113 });

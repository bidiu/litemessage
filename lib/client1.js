const ThinClient = require('./client/client');
const path = require('path');
const { getAbsRootPath } = require('./utils/common');

const protocolClass = require('./client/protocol');

const dbPath = path.join(getAbsRootPath(), 'db_client_1');
const initPeerUrls = [
  'ws://localhost:1113',
  // 'ws://localhost:2113'
];
const port = 2018;

const client1 = new ThinClient(protocolClass, dbPath, { port, initPeerUrls });

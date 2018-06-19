#!/usr/bin/env node

const os = require('os');
const path = require('path');
const mkdirp = require('mkdirp');
const LiteProtocol = require('../lib/liteprotocol/liteprotocol');
const FullNode = require('../lib/fullnode');

const ops = {
  'p': {
    alias: 'port',
    description: 'Specify port daemon will listen on',
    type: 'number',
    default: 1113
  },
  'dbpath': {
    description: 'Specify path where data will be stored',
    type: 'string'
  }
};

const defaults = {};

const usages = `Usages:
  $0 [-H|--help]
  $0 [-V|--version]
  $0 [-p|--port <num>] [--dbpath <string>] [peer1 [peer2 [...]]]`

const { argv } = require('yargs')
  .usage(usages)
  .alias('H', 'help')
  .alias('V', 'version')
  .options(ops)
  .default(defaults)
  .example('$0 --port 1113 ws://192.168.0.217:1113')
  .example('$0 --dbpath /path/db/directory ws://192.168.0.217:2113')
  .epilog('Also see https://github.com/bidiu/litemessage');

argv.dbpath = argv.dbpath || path.join(os.homedir(), '.litemsg', 'data', `${argv.port}`);

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection. Reason:\n', reason);
  process.exit(1);
});

const { port, dbpath, _: initPeerUrls } = argv;

// create the data directory
mkdirp.sync(dbpath);
// start the full litenode daemon
new FullNode(LiteProtocol, dbpath, { port, initPeerUrls });

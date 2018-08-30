#!/usr/bin/env node

const os = require('os');
const path = require('path');
const yargs = require('yargs');
const mkdirp = require('mkdirp');
const { ThinNode } = require('../dist/index');

const ops = {
  'p': {
    alias: 'port',
    description: 'Specify port daemon will listen on',
    type: 'number',
    default: 2107
  },
  'dbpath': {
    description: 'Specify path where data will be stored',
    type: 'string'
  },
  'D': {
    alias: 'debug',
    description: 'Enable debugging RESTful API server',
    type: 'boolean',
    default: undefined
  },
};

const defaults = {};

const usages = `Usages:
  $0 [-H|--help]
  $0 [-V|--version]
  $0 [-p|--port <num>] [--dbpath <str>] [-D|--debug [true|false]] [peer1 [peer2 [...]]]`

const { argv } = yargs
  .usage(usages)
  .alias('H', 'help')
  .alias('V', 'version')
  .options(ops)
  .default(defaults)
  .example('$0 --port 2107 ws://192.168.0.217:1113')
  .example('$0 --dbpath /path/db/directory ws://192.168.0.217:2113')
  .epilog('Also see https://github.com/bidiu/litemessage')
  .wrap(Math.min(yargs.terminalWidth(), 100));

argv.dbpath = argv.dbpath || path.join(os.homedir(), '.litemsg', 'data', `${argv.port}`);

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection. Reason:\n', reason);
  process.exit(1);
});

const { port, dbpath, _: initPeerUrls, debug } = argv;

// create the data directory
mkdirp.sync(dbpath);
// start the thin node
new ThinNode(dbpath, { port, initPeerUrls, debug });

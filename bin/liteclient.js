#!/usr/bin/env node

const os = require('os');
const path = require('path');
const mkdirp = require('mkdirp');
const {
  ThinNode, getCurTimestamp, data, createLitemsg,
} = require('../dist/index');

const ops = {
  'p': {
    alias: 'port',
    description: 'Specify port daemon will listen on',
    type: 'number',
    default: 2107
  }
};

const defaults = {};

const usages = `Usages:
  $0 [-H|--help]
  $0 [-V|--version]
  $0 [-p|--port <num>] peer1 [peer2 [...]] message`

const { argv } = require('yargs')
  .usage(usages)
  .alias('H', 'help')
  .alias('V', 'version')
  .options(ops)
  .default(defaults)
  .demandCommand(2)
  .example('$0 --port 2107 ws://192.168.0.217:1113 "hello, world"')
  .epilog('Also see https://github.com/bidiu/litemessage');

argv.dbpath = path.join(os.homedir(), '.litemsg', 'data', `${argv.port}`);

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection. Reason:\n', reason);
  process.exit(1);
});

const { port, dbpath } = argv;
const initPeerUrls = argv._.slice(0, -1);
const message = argv._[argv._.length - 1];

// create the litemessage
const litemsg = createLitemsg(1, getCurTimestamp(), message, '', '');
console.log('Litemessage ID: ' + litemsg.hash);

// create the data directory
mkdirp.sync(dbpath);
// start the thin node
const node  = new ThinNode(dbpath, { port, initPeerUrls });

const timer = 
  setInterval(() => {
    let peers = node.peers('full');
    if (peers.length === 0) { return; }

    // broadcast the litemessage
    peers.forEach(peer => peer.sendJson(data({ litemsgs: [litemsg] })));

    clearInterval(timer);
    setTimeout(() => process.exit(0), 7000);

  }, 3000);

const http = require('http');
const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { isValidJson, parseChunk } = require('../utils/common');

const notfoundPayload = { 'not-found': true };

/**
 * filter log entries
 */
function logFilter(logs, { peer, dir, type }) {
  return logs.filter(log => (
    (!peer || log.peer.startsWith(peer))
    && (!dir || log.dir.startsWith(dir))
    && (!type || log.msg.messageType.startsWith(type))
  ));
}

/**
 * create a very minimalist rest server for debugging
 */
function createRestServer(liteProtocol) {
  const app = express();
  const blockchain = liteProtocol.blockchain;
  const liteStore = liteProtocol.liteStore;
  const leveldb = liteProtocol.liteStore.db;

  app.use(logger('dev'));
  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.get('/', (req, res) => {
    res.status(200).json({
      endpoints: [
        { '/msgpool': 'pending litemessage pool' },
        { '/blocks': 'get all blocks on the main branch' },
        { '/blocks/:blockId': 'get specified block' },
        { '/litemsgs/:litemsgId': 'get a litemessage\'s info on blockchain' },
        { '/logs': 'protocol message logs' },
        { '/litedb/:key': 'fetch any leveldb value of a given key' }
      ]
    });
  });

  app.get('/msgpool', (req, res) => {
    res.status(200).json(liteProtocol.litemsgPool);
  });

  app.get('/blocks', async (req, res) => {
    let blocks = await blockchain.getBlocks();
    res.status(200).json(blocks);
  });

  app.get('/blocks/:blockId', async (req, res, next) => {
    try {
      let { blockId } = req.params;
      let block = await liteProtocol.blockchain.getBlock(blockId);

      if (block) {
        res.status(200).json(block);
      } else {
        res.status(404).json(notfoundPayload);
      }

    } catch (err) {
      next(err);
    }
  });

  app.get('/litemsgs/:litemsgId', async (req, res, next) => {
    try {
      let { litemsgId } = req.params;
      let at = await liteStore.readLitemsg(litemsgId);

      if (typeof at === 'undefined') {
        res.status(404).json(notfoundPayload);
        return;
      }

      let mainBranch = blockchain.onMainBranchSync(at);
      let confirmation = mainBranch ?
        blockchain.getConfirmationCntSync(at) :
        'N/A';
      
      res.status(200).json({ at, mainBranch, confirmation });

    } catch (err) {
      next(err);
    }
  });

  app.get('/logs', (req, res) => {
    let logs = liteProtocol.litenode.messageLogs;
    res.status(200).json(logFilter(logs, req.query));
  });

  app.get('/litedb/:key', async (req, res, next) => {
    try {
      let { key } = req.params;
      let buf = await leveldb.get('lite/' + key);
      let str = key.startsWith('chunk_') ?
        JSON.stringify(parseChunk(buf)) :
        buf.toString();

      let payload = isValidJson(str) ? JSON.parse(str) : { _$: str };
      res.status(200).json(payload);

    } catch (err) {
      if (err.notFound) {
        res.status(404).json(notfoundPayload);
      } else {
        next(err);
      }
    }
  });

  return http.createServer(app);
}

module.exports = createRestServer;

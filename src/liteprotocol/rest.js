const http = require('http');
const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

function logFilter(logs, { peer, dir, type }) {
  return logs.filter(log => (
    (!peer || log.peer.startsWith(peer))
    && (!dir || log.dir.startsWith(dir))
    && (!type || log.msg.messageType.startsWith(type))
  ));
}

function createRestServer(liteProtocol) {
  const app = express();

  app.use(logger('dev'));
  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.get('/', (req, res) => {
    res.status(200).json({});
  });

  app.get('/msgpool', (req, res) => {
    res.status(200).json(liteProtocol.litemsgPool);
  });

  app.get('/logs', (req, res) => {
    let logs = liteProtocol.litenode.messageLogs;
    res.status(200).json(logFilter(logs, req.query));
  });

  return http.createServer(app);
}

module.exports = createRestServer;

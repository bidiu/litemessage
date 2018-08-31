const Node = require('./node');
const ThinLiteProtocol = require('../liteprotocol/thinprotocol');

const NODE_TYPE = 'thin';

class ThinNode extends Node {
  constructor(dbPath, { protocolClass = ThinLiteProtocol, initPeerUrls = [], port, debug } = {}) {
    super(NODE_TYPE, dbPath, port, protocolClass, initPeerUrls, debug, true);
  }

  static get nodeType() {
    return NODE_TYPE;
  }

  close() {
    super.close();
  }
}

module.exports = ThinNode;

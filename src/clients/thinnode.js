const Node = require('./node');
const ThinLiteProtocol = require('../liteprotocol/thinprotocol');

const NODE_TYPE = 'thin';

class ThinNode extends Node {
  constructor(dbPath, { protocolClass = ThinLiteProtocol, initPeerUrls = [], port } = {}) {
    super(NODE_TYPE, dbPath, port, protocolClass, initPeerUrls);
  }

  static get nodeType() {
    return NODE_TYPE;
  }

  close() {
    super.close();
  }
}

module.exports = ThinNode;

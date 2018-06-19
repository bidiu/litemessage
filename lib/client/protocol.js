const P2PProtocol = require('../p2pprotocol/p2protocol');

/**
 * TODO later might change to extend liteprotocol
 */
const protocolClass = class extends P2PProtocol {
  constructor(node, nodeTypes, { minPeerNum = 8 } = {}) {
    super(node, nodeTypes, { minPeerNum });
  }
};

module.exports = protocolClass;

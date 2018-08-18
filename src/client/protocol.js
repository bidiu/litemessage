import P2PProtocol from '../p2pprotocol/p2protocol';

/**
 * TODO later might change to extend liteprotocol
 */
const protocolClass = class extends P2PProtocol {
  constructor(node, nodeTypes, { minPeerNum = 8 } = {}) {
    super(node, nodeTypes, { minPeerNum });
  }
};

export default protocolClass;

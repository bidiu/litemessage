const P2PProtocol = require('../p2pprotocol/p2protocol');
const HandshakeManager = require('./handshake');

/**
 * An experimental "thin" litemessage protocol implementation.
 * The "thin" here means this is a light weight implementation,
 * similar to SPV nodes in Bitcoin. Typically, client nodes
 * (such as used by common users with browser or CLI) will use
 * this tpye of implementation.
 * 
 * **NOTE** that this is an experimental implementation, so it
 * probably will be refactored in the future.
 */
class ThinLiteProtocol extends P2PProtocol {
  constructor(node) {
    super(node);

    this.handshake = new HandshakeManager(this);
    setTimeout(() => this.emit('ready'), 0);
  }

  close() {
    this.handshake.close();
    super.close();
  }
}

module.exports = ThinLiteProtocol

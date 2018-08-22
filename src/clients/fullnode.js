const Node = require('./node');
const LiteProtocol = require('../liteprotocol/liteprotocol');

const NODE_TYPE = 'full';

/**
 * The Litemessage fully functional node client.
 * 
 * TODO fails to bind should crash the client imediately
 */
class FullNode extends Node {
  constructor(dbPath, { protocolClass = LiteProtocol, initPeerUrls = [], port, debug } = {}) {
    super(NODE_TYPE, dbPath, port, protocolClass, initPeerUrls, debug);

    this.timer = setInterval(() => {
      console.log(`Right now, there are ${this.peers().length} connected peers (full & thin).`);
      // TODO this.debugInfo();
    }, 20000);
  }

  static get nodeType() {
    return NODE_TYPE;
  }

  close() {
    clearInterval(this.timer);
    super.close();
  }

  // TODO
  debugInfo() {
    console.log('<<<<< debug start >>>>>');
    let peerUrls = this.peers().map(peer => peer.url);
    console.log(peerUrls);
    console.log('<<<<<< debug end >>>>>>');
  }
}

module.exports = FullNode;

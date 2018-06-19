const P2PProtocol = require('../p2pprotocol/p2protocol');
const createLitemsg = require('../liteprotocol/entities/litemsg');
const { data } = require('../liteprotocol/messages');
const { getCurTimestamp } = require('../utils/time');

/**
 * TODO later might change to extend liteprotocol
 */
const protocolClass = class extends P2PProtocol {
  constructor(node, nodeTypes, { minPeerNum = 8 } = {}) {
    super(node, nodeTypes, { minPeerNum });
    this.connectionHandler = this.connectionHandler.bind(this);

    this.litemsgCnt = 0;

    this.litenode.on('connection', this.connectionHandler);
  }

  connectionHandler(peer) {
    if (this.litemsgCnt > 0) { return; }

    let litemsg = createLitemsg(
      1, getCurTimestamp(), 
      `Litemessage #${this.litemsgCnt}.`,
      '', ''
    );

    peer.sendJson(data({ litemsgs: [litemsg] }));

    this.litemsgCnt += 1;
  }
};

module.exports = protocolClass;

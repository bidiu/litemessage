const Node = require('./node');
const ThinLiteProtocol = require('../liteprotocol/thinprotocol');
const { getData } = require('../liteprotocol/messages');
const { pickItems } = require('../utils/common');

const NODE_TYPE = 'thin';

class ThinNode extends Node {
  constructor(dbPath, { protocolClass = ThinLiteProtocol, initPeerUrls = [], port, debug } = {}) {
    super(NODE_TYPE, dbPath, port, protocolClass, initPeerUrls, debug, true);
  }

  static get nodeType() {
    return NODE_TYPE;
  }

  /**
   * Fetch body (litemessage) of a given block.
   * 
   * By default, if possible, it will ask 3 fullnode
   * peers, just to make sure the body could be fetched
   * successfully.
   * 
   * Currently you cannot get notified at this class
   * when the body is fetched successfully. To get
   * notified, please have a look at the `Blockchain`
   * utility, which has low level event for that.
   */
  fetchBlockBody(blockId) {
    pickItems(this.peers('full'), 3)
      .forEach(peer => peer.sendJson(getData({ blocks: [blockId] })));
  }

  close() {
    super.close();
  }
}

module.exports = ThinNode;

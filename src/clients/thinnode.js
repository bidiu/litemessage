const Node = require('./node');
const ThinLiteProtocol = require('../liteprotocol/thinprotocol');
const {
  messageValidators, messageTypes, getData, locateLitemsgs
} = require('../liteprotocol/messages');
const { pickItems } = require('../utils/common');

const NODE_TYPE = 'thin';

/**
 * Events:
 *  - locators
 */
class ThinNode extends Node {
  constructor(dbPath, { protocolClass = ThinLiteProtocol, initPeerUrls = [], port, debug } = {}) {
    super(NODE_TYPE, dbPath, port, protocolClass, initPeerUrls, debug, true);
    this.litenode.on(`message/${messageTypes.litemsgLocators}`, this.litemsgLocatorsHandler);
  }

  static get nodeType() {
    return NODE_TYPE;
  }

  litemsgLocatorsHandler = ({ messageType, ...payload }, peer) => {
    try {
      messageValidators[messageType](payload);
      let { litemsgs, lookup } = payload;
      let locators = [];

      for (let i = 0; i < litemsgs.length; i++) {
        locators.push([litemsgs[i], lookup[i]]);
      }
      this.emit('locators', locators);

    } catch (err) {
      console.error(err);
    }
  };

  /**
   * By default, if possible, it will ask 3 fullnode
   * peers, just to make sure the body could be fetched
   * successfully.
   * 
   * To get notified by the result, you should bind a 
   * listener on the event `locators` BEFORE calling
   * this method.
   */
  locateLitemsgs(litemsgs) {
    pickItems(this.peers('full'), 3)
      .forEach(peer => peer.sendJson(locateLitemsgs({ litemsgs })));
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

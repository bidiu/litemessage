const {
  messageTypes, messageValidators, dataPartial, 
  partialNotFound
} = require('./messages');

/**
 * This inventory resolve handler is used to serve requests
 * sent by inventory resolvers.
 * 
 * For nodes supporting serving the new inventory resolution
 * mechanism, you need to instantiate this handler when
 * bootstrapping the protocol.
 */
class InvResolveHandler {
  constructor(liteprotocol) {
    this.getDataPartialHandler = this.getDataPartialHandler.bind(this);

    this.litenode = liteprotocol.litenode;
    this.blockchain = liteprotocol.blockchain;

    this.litenode.on(`message/${messageTypes.getDataPartial}`, this.getDataPartialHandler);
  }

  async getDataPartialHandler({ messageType, ...payload }, peer) {
    try {
      messageValidators[messageType](payload);
      let { merkleDigest, blocks: blockIds } = payload;
      let blocks = await Promise.all(
        blockIds.map(id => this.blockchain.getBlock(id))
      );

      if (blocks.some(block => !block)) {
        peer.sendJson(
          partialNotFound({
            merkleDigest, 
            blocks: blockIds
          })
        ); // end of sendJson

      } else {
        peer.sendJson(
          dataPartial({
            merkleDigest,
            blocks
          })
        ); // end of sendJson
      } // end of else

    } catch (err) {
      console.warn(err);
    }
  }
}

module.exports = InvResolveHandler;

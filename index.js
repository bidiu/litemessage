if (BUILD_TARGET === 'node') {
  // node (output as commonjs)

  exports.ThinClient = require('./src/client/client');
  exports.ThinClientProtocol = require('./src/client/protocol');

  exports.createLitemsg = require('./src/liteprotocol/entities/litemsg');
  exports.LiteProtocol = require('./src/liteprotocol/liteprotocol');
  module.exports = exports =  { ...exports, ...require('./src/liteprotocol/messages') };

  module.exports = exports = { ...exports, ...require('./src/utils/litecrypto') };
  module.exports = exports = { ...exports, ...require('./src/utils/time') };
  
  exports.FullNode = require('./src/fullnode');
  
} else {
  // browser (output as umd)

  module.exports = exports = { ...exports, ...require('./src/utils/litecrypto') };
}

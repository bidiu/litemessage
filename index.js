if (BUILD_TARGET === 'node') {
  // node (output as commonjs)

  exports.Node = require('./src/clients/node');
  exports.ThinNode = require('./src/clients/thinnode');
  exports.FullNode = require('./src/clients/fullnode');

  exports.createLitemsg = require('./src/liteprotocol/entities/litemsg');
  exports.LiteProtocol = require('./src/liteprotocol/liteprotocol');
  exports.ThinLiteProtocol = require('./src/liteprotocol/thinprotocol');
  module.exports = exports =  { ...exports, ...require('./src/liteprotocol/messages') };

  module.exports = exports = { ...exports, ...require('./src/utils/litecrypto') };
  module.exports = exports = { ...exports, ...require('./src/utils/time') };
  
} else {
  // browser (output as umd)

  exports.Node = require('./src/clients/node');
  exports.ThinNode = require('./src/clients/thinnode');

  module.exports = exports = { ...exports, ...require('./src/utils/litecrypto') };
}

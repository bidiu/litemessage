const messageTypes = Object.freeze({
  info: 'lite/info',
  infoAck: 'lite/info_ack',

  getBlocks: 'lite/get_blocks',
  inv: 'lite/inv',
  getData: 'lite/get_data',
  data: 'lite/data',
  getDataPartial: 'lite/get_data_partial',
  dataPartial: 'lite/data_partial',
  partialNotFound: 'lite/partial_not_found',

  getPendingMsgs: 'lite/get_pending_msgs',

  getHeaders: 'lite/get_headers',
  headers: 'lite/headers'
});

const info = ({ uuid, nodeType, daemonPort }) => ({
  messageType: messageTypes.info,
  uuid,
  nodeType,
  daemonPort
});

info.validate = ({ uuid, nodeType, daemonPort }) => {
  if (typeof uuid !== 'string') {
    throw new Error('lite/: Invalid uuid.');
  }
  if (nodeType !== 'full' && nodeType !== 'thin') {
    throw new Error('lite/: Invalid node type.');
  }
  if (daemonPort !== undefined && (typeof daemonPort !== 'number' 
      || daemonPort <= 1024)) {
    throw new Error('lite/: Invalid daemon port.');
  }
  if (nodeType === 'uuid' && !daemonPort) {
    throw new Error('lite/: Invalid daemon port.');
  }
};

const infoAck = () => ({
  messageType: messageTypes.infoAck
});

infoAck.validate = () => {
  // nothing here
}

const getBlocks = ({ blockLocators }) => ({
  messageType: messageTypes.getBlocks,
  blockLocators
});

getBlocks.validate = ({ blockLocators }) => {
  if (!(blockLocators instanceof Array)) {
    throw new Error('lite/: Invalid block locators.');
  }
};

/**
 * both params are list of ids
 */
const inv = ({ blocks = [], litemsgs = [] }) => ({
  messageType: messageTypes.inv,
  blocks,
  litemsgs
});

inv.validate = ({ blocks, litemsgs }) => {
  if (!(blocks instanceof Array)) {
    throw new Error('lite/: Invalid blocks.');
  }
  if (!(litemsgs instanceof Array)) {
    throw new Error('lite/: Invalid lite messages.');
  }
};

/**
 * both params are list of ids
 */
const getData = ({ blocks = [], litemsgs = [] }) => ({
  messageType: messageTypes.getData,
  blocks,
  litemsgs
});

getData.validate = ({ blocks, litemsgs }) => {
  if (!(blocks instanceof Array)) {
    throw new Error('lite/: Invalid blocks.');
  }
  if (!(litemsgs instanceof Array)) {
    throw new Error('lite/: Invalid lite messages.');
  }
};

const data = ({ blocks = [], litemsgs = [] }) => ({
  messageType: messageTypes.data,
  blocks,
  litemsgs
});

data.validate = ({ blocks, litemsgs }) => {
  if (!(blocks instanceof Array)) {
    throw new Error('lite/: Invalid blocks.');
  }
  if (!(litemsgs instanceof Array)) {
    throw new Error('lite/: Invalid lite messages.');
  }
};

const getDataPartial = ({ merkleDigest, blocks }) => ({
  messageType: messageTypes.getDataPartial,
  merkleDigest,
  blocks
});

getDataPartial.validate = ({ merkleDigest, blocks }) => {
  if (typeof merkleDigest !== 'string') {
    throw new Error('lite/: Invalid merkle digest.');
  }
  if (!(blocks instanceof Array)) {
    throw new Error('lite/: Invalid blocks.');
  }
};

const dataPartial = ({ merkleDigest, blocks }) => ({
  messageType: messageTypes.dataPartial,
  merkleDigest,
  blocks
});

dataPartial.validate = ({ merkleDigest, blocks }) => {
  if (typeof merkleDigest !== 'string') {
    throw new Error('lite/: Invalid merkle digest.');
  }
  if (!(blocks instanceof Array)) {
    throw new Error('lite/: Invalid blocks.');
  }
};

const partialNotFound = ({ merkleDigest, blocks }) => ({
  messageType: messageTypes.partialNotFound,
  merkleDigest,
  blocks
});

partialNotFound.validate = ({ merkleDigest, blocks }) => {
  if (typeof merkleDigest !== 'string') {
    throw new Error('lite/: Invalid merkle digest.');
  }
  if (!(blocks instanceof Array)) {
    throw new Error('lite/: Invalid blocks.');
  }
};

const getPendingMsgs = () => ({
  messageType: messageTypes.getPendingMsgs
});

getPendingMsgs.validate = () => {
  // nothing
};

// validators
const messageValidators = Object.freeze({
  [messageTypes.info]: info.validate,
  [messageTypes.infoAck]: infoAck.validate,
  [messageTypes.getBlocks]: getBlocks.validate,
  [messageTypes.inv]: inv.validate,
  [messageTypes.getData]: getData.validate,
  [messageTypes.data]: data.validate,
  [messageTypes.getDataPartial]: getDataPartial.validate,
  [messageTypes.dataPartial]: dataPartial.validate,
  [messageTypes.partialNotFound]: partialNotFound.validate,
  [messageTypes.getPendingMsgs]: getPendingMsgs.validate
});

exports.messageTypes = messageTypes;
exports.messageValidators = messageValidators;
exports.info = info;
exports.infoAck = infoAck;
exports.getBlocks = getBlocks;
exports.inv = inv;
exports.getData = getData;
exports.data = data;
exports.getDataPartial = getDataPartial;
exports.dataPartial = dataPartial;
exports.partialNotFound = partialNotFound;
exports.getPendingMsgs = getPendingMsgs;

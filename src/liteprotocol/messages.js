const messageTypes = Object.freeze({
  getBlocks: 'lite/get_blocks',
  inv: 'lite/inv',
  getData: 'lite/get_data',
  data: 'lite/data',

  getPendingMsgs: 'lite/get_pending_msgs',

  getHeaders: 'lite/get_headers',
  headers: 'lite/headers'
});

const getBlocks = ({ blockLocators }) => ({
  messageType: messageTypes.getBlocks,
  blockLocators
});

getBlocks.validate = () => {
  // TODO
};


/**
 * both params are list of ids
 */
const inv = ({ blocks = [], litemsgs = [] }) => ({
  messageType: messageTypes.inv,
  blocks,
  litemsgs
});

inv.validate = () => {
  // TODO
};


/**
 * both params are list of ids
 */
const getData = ({ blocks = [], litemsgs = [] }) => ({
  messageType: messageTypes.getData,
  blocks,
  litemsgs
});

getData.validate = () => {
  // TODO
};


const data = ({ blocks = [], litemsgs = [] }) => ({
  messageType: messageTypes.data,
  blocks,
  litemsgs
});

data.validate = () => {
  // TODO
};


const getPendingMsgs = () => ({
  messageType: messageTypes.getPendingMsgs
});

getPendingMsgs.validate = () => {
  // TODO
};


// validators
const messageValidators = Object.freeze({
  [messageTypes.getBlocks]: getBlocks.validate,
  [messageTypes.inv]: inv.validate,
  [messageTypes.getData]: getData.validate,
  [messageTypes.data]: data.validate,
  [messageTypes.getPendingMsgs]: getPendingMsgs.validate
});

exports.messageTypes = messageTypes;
exports.messageValidators = messageValidators;
exports.getBlocks = getBlocks;
exports.inv = inv;
exports.getData = getData;
exports.data = data;
exports.getPendingMsgs = getPendingMsgs;

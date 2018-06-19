// message type constants
const messageTypes = Object.freeze({
  fetchPeers: 'p2p/fetch_peers',
  returnPeers: 'p2p/return_peers'
});


/**
 * 
 */
const fetchPeers = ({ nodeTypes, limit = 20 } = {}) => ({
  messageType: messageTypes.fetchPeers, 
  nodeTypes, 
  limit
});

fetchPeers.validate = ({ nodeTypes, limit }) => {
  if (!(nodeTypes instanceof Array) || nodeTypes.length === 0) {
    throw new Error('p2p/: Invalid message, field nodeTypes.');
  }
  if (typeof limit !== 'number' || limit <= 0) {
    throw new Error('p2p/: Invalid message, field limit.');
  }
};


/**
 * 
 */
const returnPeers = ({ nodeTypes, peerUrls = [] } = {}) => ({
  messageType: messageTypes.returnPeers, 
  nodeTypes, 
  peerUrls
});

returnPeers.validate = ({ nodeTypes, peerUrls }) => {
  if (!(nodeTypes instanceof Array) || nodeTypes.length === 0) {
    throw new Error('p2p/: Invalid message, field nodeTypes.');
  }
  if (!(peerUrls instanceof Array)) {
    throw new Error('p2p/: Invalid message, field peerUrls.');
  }
};


// validators
const messageValidators = Object.freeze({
  [messageTypes.fetchPeers]: fetchPeers.validate,
  [messageTypes.returnPeers]: returnPeers.validate
});

exports.messageTypes = messageTypes;
exports.messageValidators = messageValidators;
exports.fetchPeers = fetchPeers;
exports.returnPeers = returnPeers;

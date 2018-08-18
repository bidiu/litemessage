const getRemoteAddress = (socket) => {
  return socket._socket.remoteAddress.replace(/^.*:/, '');
};

/**
 * Note that a string will be returned.
 */
const getRemotePort = (socket) => {
  return socket._socket.remotePort + '';
};

const getSocketAddress = (socket) => {
  return `${getRemoteAddress(socket)}:${getRemotePort(socket)}`;
};

export {
  getRemoteAddress, getRemotePort, getSocketAddress
};

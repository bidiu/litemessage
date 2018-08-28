const getRemoteAddress = (socket) => {
  return socket._socket.remoteAddress.replace(/^.*:/, '');
};

/**
 * Note that a string will be returned.
 */
const getRemotePort = (socket) => {
  return socket._socket.remotePort + '';
};

/**
 * Of remote end.
 * 
 * @param {*} socket 
 */
const getSocketAddress = (socket) => {
  return `${getRemoteAddress(socket)}:${getRemotePort(socket)}`;
};

const getLocalAddress = (socket) => 
  socket._socket.localAddress.replace(/^.*:/, '');

const getLocalPort = (socket) => 
  socket._socket.localPort;

const getLocalSocketAddr = (socket) =>
  `${getLocalAddress(socket)}:${getLocalPort(socket)}`;

const getSocketInfo = (socket) => ({
  localSocketAddr: getLocalSocketAddr(socket),
  remoteSocketAddr: getSocketAddress(socket)
});

exports.getRemoteAddress = getRemoteAddress;
exports.getRemotePort = getRemotePort;
exports.getSocketAddress = getSocketAddress;
exports.getLocalAddress = getLocalAddress;
exports.getLocalPort = getLocalPort;
exports.getLocalSocketAddr = getLocalSocketAddr;
exports.getSocketInfo = getSocketInfo;

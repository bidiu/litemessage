const getRemoteAddress = (socket) => {
  return socket._socket.remoteAddress;
};

const getRemotePort = (socket) => {
  return socket._socket.remotePort;
};

exports.getRemoteAddress = getRemoteAddress;
exports.getRemotePort = getRemotePort;

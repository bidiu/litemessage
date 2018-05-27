class Peer {
  constructor(uuid, socket, incoming, remoteAddress, remotePort) {
    this.uuid = uuid;
    this.socket = socket;
    this.incoming = incoming;
    this.socketAddress = remoteAddress + ':' + remotePort;
    this.remoteAddress = remoteAddress;
    this.remotePort = remotePort;
  }

  send(msg) {
    this.socket.send(msg);
  }
}

module.exports = Peer;

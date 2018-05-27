const EventEmitter = require('events');
const uuidv1 = require('uuid/v1');
const WSServer = require('./wss');
const Peer = require('./peer');

/**
 * Each Litenode should have a UUID created when start up, use this as a 
 * application level prevention from double connecting.
 */
class LiteNode extends EventEmitter {
  constructor({ port } = {}) {
    super();
    this.connectionHandler = this.connectionHandler.bind(this);
    this.socketMessageHandler = this.socketMessageHandler.bind(this);
    this.socketCloseHandler = this.socketCloseHandler.bind(this);

    let uuid = uuidv1();
    // map node's uuid to peer (socket)
    // all sockets from this SHOULD be alive
    // so you MIGHTN'T need to worry about it
    this.peers = {};
    this.wss = new WSServer(uuid, { port });
    // when bound to an network interface
    this.wss.on('listening', (port) => {
      console.log(`Start listening on port ${port}.`);
    });
    // when new connection established
    this.wss.on('connection', this.connectionHandler);
  }

  createConnection(url) {
    return this.wss.createConnection(url);
  }

  broadcast(msg, exUuids = []) {
    let peers = Object.keys(this.peers)
      .filter(uuid => !exUuids.includes(uuid))
      .map(uuid => this.peers[uuid]);

    for (let peer of peers) {
      try {
        peer.send(msg);
      } catch (err) {
        console.error(err);
      }
    }
  }

  connectionHandler(socket, incoming, remoteUuid, remoteAddress, remotePort) {
    let socketAddress = remoteAddress + ':' + remotePort;
    if (incoming) {
      console.log(`Accepted connection from ${remoteUuid || ''}@${socketAddress}.`);
    } else {
      console.log(`Established connection to ${remoteUuid || ''}@${socketAddress}.`);
    }

    socket.on('close', (code, reason) =>
      this.socketCloseHandler(code, reason, socket, remoteUuid, socketAddress));
    if (!remoteUuid) {
      console.warn(`Established connection with a peer @${socketAddress} without UUID;\n`
        + `so, going to disconnect from it.`);
        socket.close(undefined, 'NO_REMOTE_UUID');
    }
    if (this.peers.hasOwnProperty(remoteUuid)) {
      console.warn(`Established connection with a connected peer (${remoteUuid}@${socketAddress});\n`
        + `so, going to disconnect from it.`);
      socket.close(undefined, 'DOUBLE_CONNECT');
      return;
    }

    // continue the process of connection establishment
    this.peers[remoteUuid] = new Peer(remoteUuid, socket, incoming, remoteAddress, remotePort);
    socket.on('message', (msg) =>
      this.socketMessageHandler(msg, socket, remoteUuid, socketAddress));
  }

  socketMessageHandler(msg, socket, remoteUuid, socketAddress) {
    console.log(msg);
  }

  socketCloseHandler(code, reason, socket, remoteUuid, socketAddress) {
    let peer = remoteUuid ? this.peers[remoteUuid] : undefined;
    if (peer && socket === peer.socket) {
      delete this.peers[remoteUuid];
      console.log(`Disconnected from ${remoteUuid}@${socketAddress} (${code || 'N/A'} | ${reason || 'N/A'}).`);
    } else {
      console.log(`Disconnected from @${socketAddress} (${code || 'N/A'} | ${reason || 'N/A'}).`);
    }
  }
}

module.exports = LiteNode;

const EventEmitter = require('events');
const WSServer = require('./wss');
const Peer = require('./peer');
const uuidv1 = require('uuid/v1');
const { getSocketAddress } = require('./utils/network');

/**
 * Each Litenode will have a UUID automatically generated when start up. 
 * Use this UUID as an application-level mechanism to identifing a node.
 * 
 * TODO polish the close api (right now after closing, you can not use it anymore)
 * 
 * #### Events
 * - `connection`
 * - `disconnection`
 * - `message`
 * - all other events are handled by low level abstraction (you don't need 
 * to worry about).
 */
class LiteNode extends EventEmitter {
  /**
   * A UUID will be automatically generated.
   */
  constructor(nodeType, { port } = {}) {
    super();
    this.connectionHandler = this.connectionHandler.bind(this);
    this.socketMessageHandler = this.socketMessageHandler.bind(this);
    this.socketCloseHandler = this.socketCloseHandler.bind(this);

    this.uuid = uuidv1();
    this.nodeType = nodeType;
    // map node's uuid to peer (Peer)
    // all sockets from this SHOULD be alive
    // so you MIGHTN'T need to worry about it
    this.peers = {};
    this.wss = new WSServer(this.uuid, this.nodeType, { port });
    // when bound to an network interface
    this.wss.on('listening', (port) => {
      console.log(`Start listening on port ${port}.`);
    });
    // when new connection established
    this.wss.on('connection', this.connectionHandler);
  }

  /**
   * Note that you cannot have more than one socket to a single URL.
   * And also note that error could be thrown if url is invalid.
   * Failure of connection will only cause some log (won't crash
   * the application).
   * 
   * Right now, there's no way to get notified when it fail to connect
   * (such as because of timeout) except for a log mentioned before.
   */
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

  /**
   * Note that `remoteDaemonPort` and `remotePort` are string here.
   */
  connectionHandler(socket, incoming, remoteUuid, remoteDaemonPort, remoteNodeType) {
    let socketAddress = getSocketAddress(socket);
    if (incoming) {
      console.log(`Accepted connection from ${remoteUuid || ''}@${socketAddress}.`);
    } else {
      console.log(`Established connection to ${remoteUuid || ''}@${socketAddress}.`);
    }

    socket.on('close', (code, reason) =>
      this.socketCloseHandler(code, reason, socket, remoteUuid));
    // a series of checking follows...
    if (!remoteUuid) {
      console.warn(`Established connection with a peer @${socketAddress} without UUID;\n`
        + `so, going to disconnect from it.`);
      socket.close(undefined, 'NO_REMOTE_UUID');
      return;
    }
    if (!remoteDaemonPort) {
      console.warn(`Established connection with a peer @${socketAddress} without daemon port;\n`
        + `so, going to disconnect from it.`);
      socket.close(undefined, 'NO_DAEMON_PORT');
      return;
    }
    if (!remoteNodeType) {
      console.warn(`Established connection with a peer @${socketAddress} without node type;\n`
        + `so, going to disconnect from it.`);
      socket.close(undefined, 'NO_NODE_TYPE');
      return;
    }
    if (this.peers.hasOwnProperty(remoteUuid)) {
      console.warn(`Established connection with a connected peer (${remoteUuid}@${socketAddress});\n`
        + `so, going to disconnect from it.`);
      socket.close(undefined, 'DOUBLE_CONNECT');
      return;
    }

    // continue the process of connection establishment
    let newPeer = new Peer(remoteUuid, socket, incoming, remoteDaemonPort, remoteNodeType);
    this.peers[remoteUuid] = newPeer;
    socket.on('message', (msg) => this.socketMessageHandler(msg, newPeer));
    // notify listeners
    this.emit('connection', newPeer);
  }

  socketMessageHandler(msg, peer) {
    // notify listeners
    this.emit('message', msg, peer);
  }

  socketCloseHandler(code, reason, socket, remoteUuid) {
    let peer = remoteUuid ? this.peers[remoteUuid] : undefined;
    let socketAddress = getSocketAddress(socket);

    if (peer && socket === peer.socket) {
      console.log(`Disconnected from ${remoteUuid}@${socketAddress} (${code || 'N/A'} | ${reason || 'N/A'}).`);
      delete this.peers[remoteUuid];
      // notify listeners
      this.emit('disconnection', peer);
    } else {
      console.log(`Disconnected from @${socketAddress} (${code || 'N/A'} | ${reason || 'N/A'}).`);
    }
  }

  /**
   * Close this node (both server and outgoing socket connections will
   * be closed)
   */
  close(callback) {
    this.wss.close(callback);
  }
}

module.exports = LiteNode;

import EventEmitter from 'events';
import WSServer from './wss';
import Peer from './peer';
import uuidv1 from 'uuid/v1';
import { getSocketAddress } from './utils/network';
import { getCurTimestamp } from './utils/time';

/**
 * Each Litenode will have a UUID automatically generated when start up. 
 * Use this UUID as an application-level mechanism to identifing a node.
 * 
 * TODO polish the close api (right now after closing, you can not use it anymore),
 *    and also levelup's close callback.
 * 
 * #### Events
 * - `connection`
 * - `disconnection`
 * - `message`
 * - `message/${message_type}`
 * - all other events are handled by low level abstraction (you don't need 
 * to worry about).
 */
class LiteNode extends EventEmitter {
  /**
   * A UUID will be automatically generated.
   */
  constructor(nodeType, { port, debug = true } = {}) {
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

    // used for debugging (view all protocol messages since start)
    this.debug = debug;
    this.messageLogs = [];

    this.wss = new WSServer(this.uuid, this.nodeType, { port });
    // when bound to an network interface
    this.wss.on('listening', (port) => {
      console.log(`${this.uuid}: Start listening on port ${port}.`);
      if (this.debug) { console.log('Debug mode is enabled.'); }
    });
    // when new connection established
    this.wss.on('connection', this.connectionHandler);
  }

  /**
   * Create a proxy to intercept the `send` function call,
   * mainly for debugging/logging.
   */
  createSocketProxy(socket, remoteUuid) {
    const messageLogs = this.messageLogs;

    const handler = {
      get: (socket, propName) => {
        if (propName !== 'send') { return socket[propName]; }
        // return the wrapper function as a proxy
        return function (data, options, callback) {
          messageLogs.push({
            peer: remoteUuid,
            dir: 'outbound',
            msg: JSON.parse(data),
            time: getCurTimestamp('s')
          });

          return socket.send(data, options, callback);
        };
      }
    };
    // create socket proxy and return
    return new Proxy(socket, handler);
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

  /**
   * @param {string} msg 
   * @param {Array<string>} exUuids 
   */
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
   * @param {Object} jsonObj 
   * @param {Array<string>} exUuids 
   */
  broadcastJson(jsonObj, exUuids) {
    this.broadcast(JSON.stringify(jsonObj), exUuids);
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

    // continue the process of connection establishment...

    if (this.debug) {
      socket = this.createSocketProxy(socket, remoteUuid);
    }
    let newPeer = new Peer(remoteUuid, socket, incoming, remoteDaemonPort, remoteNodeType);
    this.peers[remoteUuid] = newPeer;
    socket.on('message', (msg) => this.socketMessageHandler(msg, newPeer));
    // notify listeners
    this.emit('connection', newPeer);
  }

  socketMessageHandler(msg, peer) {
    // notify listeners
    this.emit('message', msg, peer);

    let msgObj = null;
    try { msgObj = JSON.parse(msg); } catch (e) {}
    if (msgObj && msgObj['messageType']) {
      // note that only logs valid procotol messages
      this.messageLogs.push({
        peer: peer.uuid,
        dir: 'inbound',
        msg: msgObj,
        time: getCurTimestamp('s')
      });

      this.emit(`message/${msgObj['messageType']}`, msgObj, peer);
    }
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

export default LiteNode;

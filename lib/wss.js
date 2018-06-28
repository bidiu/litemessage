const EventEmitter = require('events');
const WebSocket = require('ws');
const { URL } = require('url');
const { getSocketAddress } = require('./utils/network');

// remote end's uuid
const uuidHeaderName = 'x-litemessage-uuid';
// remote end's listening (daemon) port
const portHeaderName = 'x-litemessage-port';
// remote end's node type
const typeHeaderName = 'x-litemessage-type';

const socketEvents = [
  'close', 'error', 'message', 'open', 'ping',
  'unexpected-response', 'upgrade'
];

/**
 * Provide abstraction for underlaying transportation protocol. It behaves 
 * both like a server and a client - it will connect to several clients, 
 * and also several servers (P2P network).
 * 
 * The P2P network is a directed graph with bidirectional communication channels.
 * 
 * TODO proxy for socket
 * TODO close reason doesn't work
 * TODO investigate even emitter memory leak
 * TODO document events
 * TODO docker delievery
 * 
 * ##### Events
 * - `listening` (port: string) - when the underlying ws server binds successfully
 * - `connection` (socket, incoming, remoteUuid, remoteDaemonPort, remoteNodeType)
 * 
 * For all other events, use the underlying web socket object.
 */
class WSServer extends EventEmitter {
  constructor(uuid, nodeType, { port = 1113 } = {}) {
    super();
    this.connectionHandler = this.connectionHandler.bind(this);
    
    this.uuid = uuid;
    this.nodeType = nodeType;
    this.port = port + '';
    // used in handshake (for initiator to send)
    this.headers = {
      [uuidHeaderName]: this.uuid,
      [portHeaderName]: this.port,
      [typeHeaderName]: this.nodeType
    };
    // map remote socket addresses (ip:port) to sockets
    this.servers = {};
    
    // create underlaying server and listen
    this.wss = new WebSocket.Server({ port });
    // when bound to an network interface
    this.wss.on('listening', () => this.emit('listening', port));
    // before sending upgrade response
    this.wss.on('headers', (headers, req) => {
      // add uuid header to upgrade response
      headers.push([`${uuidHeaderName}: ${this.uuid}`]);
      headers.push([`${portHeaderName}: ${this.port}`]);
      headers.push([`${typeHeaderName}: ${this.nodeType}`]);
    });
    // when receiving incoming connection
    this.wss.on('connection', (socket, req) => {
      let remoteUuid = req.headers[uuidHeaderName];
      let remoteDaemonPort = req.headers[portHeaderName];
      let remoteNodeType = req.headers[typeHeaderName];
      this.connectionHandler(socket, true, remoteUuid, remoteDaemonPort, remoteNodeType);
    });
    this.wss.on('error', console.log);

    // set up heartbeats
    this.timer = setInterval(this.genHeartbeat(), 60000);
  }

  /**
   * Close this node (both server and outgoing socket connections will
   * be closed)
   */
  close(callback) {
    clearInterval(this.timer);
    this.wss.close(callback);
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
    let socketAddress = null;
    let remoteDaemonPort = null;
    try {
      ({ host: socketAddress, port: remoteDaemonPort } = new URL(url));
      if (!socketAddress || !remoteDaemonPort.match(/^\d+$/)) { throw new Error(); }
    } catch (err) {
      throw new Error(`Wrong url (${url}) to connect.`);
    }

    let prevSocket = this.servers[socketAddress];
    if (prevSocket && this.socketAlive(prevSocket)) {
      console.warn(`Tried to connect to same url (${url}) twice. Operation aborted.`);
      return;
    }

    let remoteUuid = undefined;
    let remoteNodeType = undefined;
    let socket = new WebSocket(url, { headers: this.headers, handshakeTimeout: 10000 });
    socket.on('upgrade', resp => {
      // read uuid and node type from upgrade response header
      remoteUuid = resp.headers[uuidHeaderName];
      remoteNodeType = resp.headers[typeHeaderName];
    });
    socket.on('open', () => {
      let prevSocket = this.servers[socketAddress];
      if (prevSocket && this.socketAlive(prevSocket)) {
        // TODO investigate memory leak
        socket.on('close', () => this.unregisterSocketListeners(socket));
        socket.close(undefined, 'DOUBLE_CONNECT');
        return;
      }
      socket.removeAllListeners('error');
      this.connectionHandler(socket, false, remoteUuid, remoteDaemonPort, remoteNodeType);
      this.servers[socketAddress] = socket;
    });
    socket.on('error', (err) =>
      console.log(`Unable to establish connect to ${url}. Details:\n${err}.`));
  }

  genHeartbeat() {
    let noop = () => {};
    return () => {
      for (let socket of [...this.wss.clients, ...Object.values(this.servers)]) {
        if (this.socketAbnormal(socket)) {
          socket.terminate();
        }
        // set socket `alive` to false, later pong response
        // from client will recover `alive` from false to true
        socket.alive = false;
        socket.ping(noop);
      }
    }
  }

  /**
   * @param {*} socket                  the underlaying socket
   * @param {boolean} incoming          whether the connection is incoming
   * @param {string} remoteUuid         remote peer's uuid
   * @param {string} remoteDaemonPort   remote peer's litenode deamon port
   */
  connectionHandler(socket, incoming, remoteUuid, remoteDaemonPort, remoteNodeType) {
    let socketAddress = getSocketAddress(socket);
    socket.alive = true;
    socket.on('message', () => socket.alive = true);
    socket.on('pong', () => socket.alive = true);
    socket.on('close', () => {
      socket.alive = false;
      this.unregisterSocketListeners(socket);
      if (socket === this.servers[socketAddress]) {
        delete this.servers[socketAddress];
      }
    });
    socket.on('error', err => {
      console.log(err);
      socket.terminate();
    });
    // notify subscribers
    this.emit('connection', socket, incoming, remoteUuid, remoteDaemonPort, remoteNodeType);
  }

  socketAbnormal(socket) {
    return !socket.alive && socket.readyState === WebSocket.OPEN;
  }

  socketAlive(socket) {
    return socket.readyState === WebSocket.OPEN;
  }

  unregisterSocketListeners(socket) {
    socketEvents.forEach(e => socket.removeAllListeners(e));
  }
}

module.exports = WSServer;

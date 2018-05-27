const EventEmitter = require('events');
const WebSocket = require('ws');

const uuidHeaderName = 'x-litemessage-uuid';

const socketEvents = [
  'close', 'error', 'message', 'open', 'ping',
  'unexpected-response', 'upgrade'
];

/**
 * Provide abstraction for underlaying transportation protocol. It behaves 
 * both like a server and a client - it will connect to several clients, 
 * and also several servers (P2P network).
 * 
 * TODO proxy for socket
 * TODO what if starting mutiple ndoes,
 *    one node with mutiple sockets to same peer
 * TODO close reason
 * TODO IPV6 address
 */
class WSServer extends EventEmitter {
  constructor(uuid, { port = 1113 } = {}) {
    super();
    this.connectionHandler = this.connectionHandler.bind(this);
    
    this.uuid = uuid;
    // used in handshake
    this.headers = { [uuidHeaderName]: this.uuid };
    // map urls to sockets
    this.servers = {};
    
    // create underlaying server and listen
    this.wss = new WebSocket.Server({ port });
    // when bound to an network interface
    this.wss.on('listening', () => this.emit('listening', port));
    // before sending upgrade response
    this.wss.on('headers', (headers, req) => 
      // add uuid header to upgrade response
      headers.push([`${uuidHeaderName}: ${this.uuid}`]));
    this.wss.on('connection', (socket, req) => 
      this.connectionHandler(socket, true, req.headers[uuidHeaderName]));
    this.wss.on('error', console.log);

    // set up heartbeats
    this.timer = setInterval(this.genHeartbeat(), 60000);
  }

  close(callback) {
    clearInterval(this.timer);
    this.wss.close(callback);
  }

  /**
   * You cannot have more than one socket to a single url.
   * TODO a way to know whether successful
   */
  createConnection(url) {
    let prevSocket = this.servers[url];
    if (prevSocket && this.socketAlive(prevSocket)) {
      console.warn(`Tried to connect to same url (${url}) twice. Operation aborted.`);
      return;
    }

    let remoteUuid = undefined;
    let socket = new WebSocket(url, { headers: this.headers, handshakeTimeout: 10000 });
    socket.on('upgrade', resp => 
      // read uuid from upgrade response header
      remoteUuid = resp.headers[uuidHeaderName]);
    socket.on('open', () => {
      let prevSocket = this.servers[url];
      if (prevSocket && this.socketAlive(prevSocket)) {
        // TODO investigate memory leak
        socket.on('close', () => this.unregisterSocketListeners(socket));
        socket.close(undefined, 'DOUBLE_CONNECT');
        return;
      }
      socket.removeAllListeners('error');
      this.connectionHandler(socket, false, remoteUuid);
      this.servers[url] = socket;
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

  connectionHandler(socket, incoming, remoteUuid) {
    let { remoteAddress, remotePort } = socket._socket;
    remoteAddress = remoteAddress.replace(/^.*:/, '');
    let url = 'ws://' + remoteAddress + ':' + remotePort;
    socket.alive = true;
    socket.on('message', () => socket.alive = true);
    socket.on('pong', () => socket.alive = true);
    socket.on('close', () => {
      socket.alive = false;
      this.unregisterSocketListeners(socket);
      if (socket === this.servers[url]) {
        delete this.servers[url];
      }
    });
    socket.on('error', err => {
      console.log(err);
      socket.terminate();
    });
    // notify subscribers
    this.emit('connection', socket, incoming, remoteUuid, remoteAddress, remotePort);
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

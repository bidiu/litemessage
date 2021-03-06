const WSClient = require('./wsc');
const { getSocketAddress } = require('./utils/network');
const { getCurTimestamp } = require('./utils/time');

if (BUILD_TARGET === 'node') {
  // running in node
  var EventEmitter = require('events');
  var WSServer = require('./wss');
} else {
  // running in browser
  var EventEmitter = require('wolfy87-eventemitter');
}

/**
 * This class is the abstraction of "node" (litenode) inside the litemessage
 * peer-to-peer network. It is on top of Websocket layer by composing `WSServer`
 * when runing in nodejs environment, or `WSClient` when runing as "thin" node in
 * both nodejs and browser environments. 
 * 
 * This class is protocol-agnostic, meaning it doesn't assume any detail of
 * the implmentation of litemessage's protocol. Instead, it just provides some
 * APIs and async events for implementing the protocol and any kind of litemessage
 * client ("thin" / "full" node) on top of that.
 * 
 * You must provide a UUID to the contructor. The UUID is the unique identifier 
 * identify a unique node inside the peer-to-peer network.
 * 
 * By default, node use 1113 as the daemon port inside the network.
 * 
 * TODO log handshake communication traffic
 * TODO use debug config, also support cli to specify
 * TODO support specifying the interface to bind
 * 
 * #### Events
 * - `socketconnect` - low level socket connection (simple wrapper around wss's)
 * - `peerconnect` - high level peer connection
 * - `peerdisconnect` - high level peer disconnection
 * - `message/${message_type}` - high level protocol-specific messages
 * 
 * All other events are handled by low level abstraction, so you don't need to
 * worry about : P
 */
class LiteNode extends EventEmitter {
  constructor(uuid, { port = 1113, debug = false, noserver = false } = {}) {
    super();
    this.socketConnectHandler = this.socketConnectHandler.bind(this);
    this.socketMessageHandler = this.socketMessageHandler.bind(this);
    this.socketCloseHandler = this.socketCloseHandler.bind(this);

    this.uuid = uuid;
    this.daemonPort = noserver ? undefined : port;
    this.debugPort = port + 1;
    this.noserver = noserver;

    // node's uuid => peer
    this.peers = {};
    // remote socket addresses (str) => peers
    this.socketsToPeers = {};

    // used for debugging (view all protocol messages since start)
    this.debug = debug;
    this.messageLogs = [];

    // create the underlyng websocket server
    this.wss = noserver ? new WSClient() : new WSServer(port);
    if (!noserver) {
      // when bound to an network interface
      this.wss.on('listening', (port) => {
        console.log(`${uuid}: Start listening on port ${port}.`);
        if (debug) { console.log('Debug mode is enabled.'); }
      });
    }
    // when new connection established
    this.wss.on('connection', this.socketConnectHandler);
  }

  /**
   * Create a proxy to intercept the `send` function call,
   * mainly for debugging / logging.
   */
  createSocketProxy(socket, remoteUuid) {
    if (!this.debug) { return socket; }

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

  socketConnectHandler(socket, incoming) {
    let socketAddress = getSocketAddress(socket);
    if (incoming) {
      console.log(`Accepted socket connection from ${socketAddress}.`);
    } else {
      console.log(`Established socket connection to ${socketAddress}.`);
    }

    socket.on('close', (code, reason) =>
      this.socketCloseHandler(code, reason, socket));

    // notify listeners
    this.emit('socketconnect', socket, incoming);
  }

  socketMessageHandler(msg, peer) {
    let msgObj = null;
    try { msgObj = JSON.parse(msg); } catch (e) {}
    
    if (msgObj && msgObj['messageType']) {
      if (this.debug) {
        // note that only logs valid procotol messages
        this.messageLogs.push({
          peer: peer.uuid,
          dir: 'inbound',
          msg: msgObj,
          time: getCurTimestamp('s')
        });
      }

      this.emit(`message/${msgObj['messageType']}`, msgObj, peer);
    }
  }

  socketCloseHandler(code, reason, socket) {
    let socketAddress = getSocketAddress(socket);
    let peer = this.socketsToPeers[socketAddress]

    if (peer) {
      delete this.peers[peer.uuid];
      delete this.socketsToPeers[socketAddress]
      console.log(`Disconnected from ${peer.uuid}@${socketAddress}.`);
      // notify listeners
      this.emit('peerdisconnect', peer);
    }
    console.log(`Closed socket connection with ${socketAddress} (${code || 'N/A'} | ${reason || 'N/A'}).`);
  }

  /**
   * Add new peer to peer collection of this node. The protocol
   * implmementation should call this after a protocol-specific
   * handshake completes (this class is protocol agnostic).
   */
  addNewPeer(peer) {
    let { uuid, socket, incoming, nodeType } = peer;
    let socketAddress = getSocketAddress(socket);

    if (this.peers.hasOwnProperty(uuid)) {
      console.warn(`Established connection with a connected peer (${uuid}@${socketAddress});\n`
        + `so, going to disconnect from it.`);
      socket.close(undefined, 'DOUBLE_CONNECT');
      return;
    }

    peer.socket = socket = this.createSocketProxy(socket, uuid);
    this.peers[uuid] = peer;
    this.socketsToPeers[socketAddress] = peer;
    socket.on(BUILD_TARGET === 'node' ? 'message' : 'data', (message) => 
      this.socketMessageHandler(message, peer));

    if (incoming) {
      console.log(`Accepted connection from ${peer.uuid}@${socketAddress} (${nodeType}).`);
    } else {
      console.log(`Established connection to ${peer.uuid}@${socketAddress} (${nodeType}).`);
    }

    // notify listeners
    this.emit('peerconnect', peer);
  }

  /**
   * Get some useful information about this node.
   */
  getInfo() {
    let network = this.wss.getInfo();

    if (network.sockets) {
      for (let socketInfo of network.sockets) {
        let peer = this.socketsToPeers[socketInfo.remoteSocketAddr];

        socketInfo.remoteUuid = peer.uuid;
        socketInfo.remoteDaemonPort = peer.daemonPort;
      }
    }

    return {
      uuid: this.uuid,
      daemonPort: this.daemonPort,
      network,
    };
  }

  /**
   * Close this node (both server and outgoing socket connections will
   * be closed)
   */
  close() {
    this.removeAllListeners();
    this.wss.close();
  }
}

module.exports = LiteNode;

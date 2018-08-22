const Peer = require('../peer');
const {
  messageValidators, info, infoAck,
  messageTypes: { info: infoType, infoAck: infoAckType }
} = require('./messages');
const { getCurTimestamp } = require('../utils/time');
const { getSocketAddress } = require('../utils/network');

if (BUILD_TARGET === 'node') {
  // running in node

  var EventEmitter = require('events');

} else {
  // running in browser

  var EventEmitter = require('wolfy87-eventemitter');
}

// ********************* requiring ends *********************

// allowed message types during handshake
const MSG_TYPES = [infoType, infoAckType];

class PendingSocket {
  constructor(socket, incoming) {
    // the pending socket itself
    this.socket = socket;

    // inbound or outbound
    this.incoming = incoming;

    // 'INIT'
    // 'INFO_SENT'
    // 'ESTABLISHED'
    this.state = 'INIT';

    // the timestamp when socket is created
    this.timestamp = getCurTimestamp();

    // remote info
    this.uuid = undefined;
    this.nodeType = undefined;
    this.daemonPort = undefined;
  }
}

// ******************** common code ends ********************

// **************** env-specific code starts ****************

if (BUILD_TARGET === 'node') {
  // run in node

  var HandshakeManager = class extends EventEmitter {
    constructor(p2pProtocol) {
      super();
      this.socketConnectHandler = this.socketConnectHandler.bind(this);

      this.litenode = p2pProtocol.litenode;
      this.uuid = p2pProtocol.litenode.uuid;
      this.nodeType = p2pProtocol.node.nodeType;
      this.daemonPort = p2pProtocol.litenode.daemonPort;

      // sockets => pending sockets (which is a wrapper)
      this.pendingSockets = new Map();

      // listen on new socket connection
      this.litenode.on('socketconnect', this.socketConnectHandler);

      // in case too many pending connections (such as DDoS),
      // drop pending connections after roughly 20s' idle
      this.timer = setInterval(() => {
        let now = getCurTimestamp();
        for (let [socket, pendingSocket] of this.pendingSockets) {
          if (now - pendingSocket.timestamp > 20000) {
            console.warn(`Handshake timeouts with ${getSocketAddress(socket)}.`);
            socket.close(undefined, 'HANDSHAKE_TIMEOUTS');
            this.pendingSockets.delete(socket);
          }
        }

      }, 10000);
    }

    addPendingSocket(socket, incoming) {
      try {
        let pendingSocket = new PendingSocket(socket, incoming);

        socket._messageHandler = ((message) => {
          try {
            let { state } = pendingSocket
            let { messageType, ...payload } = JSON.parse(message);
            if (typeof messageType !== 'string' || !MSG_TYPES.includes(messageType)) {
              throw new Error();
            }
            
            // when receiving info message
            if (messageType === infoType) {
              messageValidators[infoType](payload);
    
              if (incoming && state === 'INIT') {
                pendingSocket.state = 'INFO_SENT'
                pendingSocket.uuid = payload.uuid;
                pendingSocket.nodeType = payload.nodeType;
                pendingSocket.daemonPort = payload.daemonPort;
    
                this.sendInfo(socket);
    
              } else if (!incoming && state === 'INFO_SENT') {
                pendingSocket.state = 'ESTABLISHED';
                pendingSocket.uuid = payload.uuid;
                pendingSocket.nodeType = payload.nodeType;
                pendingSocket.daemonPort = payload.daemonPort;
    
                this.sendInfoAck(socket);
                this.onEstablished(pendingSocket);
    
              } else {
                throw new Error();
              }
            }
    
            // when receiving info ack message
            if (messageType === infoAckType) {
              messageValidators[infoAckType](payload);
    
              if (incoming && state === 'INFO_SENT') {
                pendingSocket.state = 'ESTABLISHED';
    
                this.onEstablished(pendingSocket);
    
              } else {
                throw new Error();
              }
            }
    
          } catch (err) {
            console.warn(`Handshake failed with ${getSocketAddress(socket)}, reason:\n${err.stack}`);
            // close the underlying socket
            socket.close(undefined, 'HANDSHAKE_FAILED');
          }

        }).bind(this); // end of _messageHandler


        this.pendingSockets.set(socket, pendingSocket);
        socket.on('message', socket._messageHandler);

        if (!incoming) {
          // sending the first info message
          // to initiate the handshake process
          this.sendInfo(socket);
          pendingSocket.state = 'INFO_SENT'
        }

      } catch (err) {
        console.warn(`Handshake failed with ${getSocketAddress(socket)}, reason:\n${err}`);
        // close the underlying socket
        socket.close(undefined, 'HANDSHAKE_FAILED');
      }
    }

    socketConnectHandler(socket, incoming) {
      this.addPendingSocket(socket, incoming);
    }

    // on handshake completing
    onEstablished(pendingSocket) {
      let { socket, incoming, uuid, nodeType, daemonPort } = pendingSocket;
      let peer = new Peer(uuid, socket, incoming, daemonPort, nodeType);

      socket.removeListener('message', socket._messageHandler);
      delete socket._messageHandler
      
      this.pendingSockets.delete(socket);
      this.litenode.addNewPeer(peer);
    }

    sendInfo(socket) {
      socket.send(JSON.stringify(info({
        uuid: this.uuid, 
        nodeType: this.nodeType,
        daemonPort: this.daemonPort
      })));
    }

    sendInfoAck(socket) {
      socket.send( JSON.stringify(infoAck()) );
    }

    /**
     * Do the cleanup.
     */
    close() {
      if (this.timer) {
        clearInterval(this.timer);
      }
    }
  }; // end of HandshakeManager

} else {
  // run in browser

  var HandshakeManager = undefined;
}

module.exports = HandshakeManager;

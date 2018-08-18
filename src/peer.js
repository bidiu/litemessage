import { getRemoteAddress } from './utils/network';

class Peer {
  /**
   * @param {string} uuid             peer's uuid
   * @param {*} socket                network socket to the peer
   * @param {boolean} incoming        whehter the connection is incoming
   * @param {string} daemonPort       peer's daemon port
   * @param {string} nodeType         peer's node type
   */
  constructor(uuid, socket, incoming, daemonPort, nodeType) {
    this.uuid = uuid;
    this.socket = socket;
    this.incoming = incoming;
    this.daemonPort = daemonPort;
    this.nodeType = nodeType;
    this.url = `ws://${getRemoteAddress(socket)}:${daemonPort}`;
  }

  /**
   * Note that error might be thrown, such as when trying to 
   * send data through closed connection (very rare though - the
   * underlaying litenode will take care of that).
   * 
   * @param {string} message to send
   */
  send(msg) {
    this.socket.send(msg);
  }

  /**
   * Note that error might be thrown, such as when trying to 
   * send data through closed connection (very rare though - the
   * underlaying litenode will take care of that).
   * 
   * @param {Object} jsonObj object to send
   */
  sendJson(jsonObj) {
    this.send(JSON.stringify(jsonObj));
  }

  toString() {
    return `${this.nodeType} - ${this.url}`;
  }
}

export default Peer;

const prefix = 'p2p/';

const genKey = key => prefix + key;

class P2PProtocolStore {
  constructor(db) {
    this.db = db;
  }

  /**
   * Flush current connected peers' URLs into DB. 
   * Note that you should only provide peers with 
   * desired `nodeType`s.
   */
  async writeCurPeerUrls(peerUrls) {
    let data = JSON.stringify(peerUrls);
    return this.db.put(genKey('cur_peer_urls'), data);
  }

  async readCurPeerUrls() {
    try {
      let buf = await this.db.get(genKey('cur_peer_urls'));
      return JSON.parse(buf.toString());
    } catch (err) {
      if (err.notFound) { return []; }
      throw err;
    }
  }
}

export default P2PProtocolStore;

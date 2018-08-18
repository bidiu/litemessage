import { sha256 } from '../../utils/litecrypto';

/**
 * @param {string} ver      version number (now hardcoded to 1, I don't have time :|)
 * @param {int} time        timestamp (unix time)
 * @param {string} litemsg  litemessage itself
 * @param {string} sig      signature
 * @param {string} pubKey   public key
 */
const createLitemsg = (ver, time, litemsg, sig, pubKey) => {
  let hash = sha256(`${ver}${time}${litemsg}${sig}${pubKey}`);
  return { ver, time, litemsg, sig, pubKey, hash };
};

export default createLitemsg;

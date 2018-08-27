const path = require('path');

const isValidJson = (json) => {
  if (typeof json !== 'string' || !json) {
    return false;
  }

  try {
    JSON.parse(json);
    return true;
  } catch (e) { }
  return false;
};

/**
 * project's root path, of course this file cannot be moved around
 */
const getAbsRootPath = () => {
  return path.join(__dirname, '../..');
};

/**
 * From 0 (inclusive) to `max` (exclusive).
 */
const randomInt = (max) => {
  return Math.floor(Math.random() * Math.floor(max));
};

/**
 * Randomly pick `num` items from an array. Note that original array 
 * won't be altered. And also the order of items won't be preserved 
 * in the picked array.
 */
const pickItems = (array, num) => {
  let copiedArray = [...array];
  let picked = [];
  num = Math.min(array.length, num);
  for (let i = 0; i < num; i++) {
    picked.push(...copiedArray.splice(randomInt(copiedArray.length), 1));
  }
  return picked;
};

const sliceItems = (array, slices) => {
  slices = Math.max( Math.min(array.length, slices), 1 );

  let l = Math.floor(array.length / slices);
  let sliced = [];

  for (let i = 0; i < slices; i++) {
    if (i + 1 === slices) {
      sliced.push( array.slice(l * i) );
    } else {
      sliced.push( array.slice(l * i, l * (i + 1)) );
    }
  }
  return sliced;
};

const parseChunk = (buffer) => {
  if (buffer.length % 32) { throw new Error('Invalid chunk buffer.'); }

  let hashes = [];
  for (let i = 0; i < buffer.length; i += 32) {
    hashes.push(buffer.slice(i, i + 32).toString('hex'));
  }
  return hashes;
};

exports.isValidJson = isValidJson;
exports.getAbsRootPath = getAbsRootPath;
exports.randomInt = randomInt;
exports.pickItems = pickItems;
exports.sliceItems = sliceItems;
exports.parseChunk = parseChunk;

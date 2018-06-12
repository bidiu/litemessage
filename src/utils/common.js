const path = require('path');

const isValidJson = (json) => {
  if (typeof str != 'string' || !str) {
    return false;
  }

  try {
    JSON.parse(str);
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

exports.isValidJson = isValidJson;
exports.getAbsRootPath = getAbsRootPath;
exports.randomInt = randomInt;
exports.pickItems = pickItems;

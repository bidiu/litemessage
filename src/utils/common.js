const path = require('path');

const isValidJson = (json) => {
  try {
    return JSON.parse(json);
  } catch (err) {
    return false;
  }
};

const getAbsRootPath = () => {
  return path.join(__dirname, '../..');
}

exports.isValidJson = isValidJson;
exports.getAbsRootPath = getAbsRootPath;

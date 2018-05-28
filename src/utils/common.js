const isValidJson = (json) => {
  try {
    return JSON.parse(json);
  } catch (err) {
    return false;
  }
};

exports.isValidJson = isValidJson;

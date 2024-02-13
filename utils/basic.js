const { ObjectId } = require('mongodb');

const basicUtils = {
  isValidId(id) {
    if (!ObjectId.isValid(id)) {
      return false;
    }
    return true;
  }
};

module.exports = basicUtils;

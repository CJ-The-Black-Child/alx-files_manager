const mongodb = require('mongodb');

const basicUtils = {
  isValidId (id) {
    try {
      new mongodb.ObjectId(id);
    } catch (err) {
      return false;
    }
    return true;
  }
};

module.exports = basicUtils;

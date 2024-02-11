const mongodb = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const dbURL = `mongodb://${host}:${port}/${database}`;

    this.client = new mongodb.MongoClient(dbURL, { useUnifiedTopology: true });
    this.client.connect();
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    return this.collection('users').countDocuments();
  }

  async nbFiles() {
    return this.collection('files').countDocuments();
  }

  async collection(name) {
    return this.client.db().collection(name);
  }
}

module.exports = new DBClient();

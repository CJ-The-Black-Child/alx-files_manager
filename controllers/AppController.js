const RedisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class AppController {
  static getStatus(req, res) {
    res.status(200).send({ redis: RedisClient.isAlive(), db: dbClient.isAlive() });
  }

  static async getStats(req, res) {
    res.status(200).send({ users: await dbClient.nbUsers(), files: await dbClient.nbFiles() });
  }
}

module.exports = AppController;

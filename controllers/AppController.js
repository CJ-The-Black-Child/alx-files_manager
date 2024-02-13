const RedisClient = require('../utils/redis');
const { isAlive: dbIsAlive, nbUsers, nbFiles } = require('../utils/db');

class AppController {
  static getStatus(req, res) {
    res.status(200).send({ redis: RedisClient.isAlive(), db: dbIsAlive() });
  }

  static async getStats(req, res) {
    res.status(200).send({ users: await nbUsers(), files: await nbFiles() });
  }
}

module.exports = AppController;

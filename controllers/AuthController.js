const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');
const { set } = require('../utils/redis');
const { getUser, getUserIdAndKey } = require('../utils/user');

class AuthController {
  static async getConnect(request, response) {
    const Authorization = request.header('Authorization') || '';
    const credentials = Authorization.split(' ')[1];

    if (!credentials) return response.status(401).send({ error: 'Unauthorized' });

    const [email, password] = Buffer.from(credentials, 'base64').toString('utf-8').split(':');

    if (!email || !password) return response.status(401).send({ error: 'Unauthorized' });

    const user = await getUser({ email, password: sha1(password) });

    if (!user) return response.status(401).send({ error: 'Unauthorized' });

    const token = uuidv4();
    await set(`auth_${token}`, user._id.toString(), 24 * 3600);

    return response.status(200).send({ token });
  }

  static async getDisconnect(request, response) {
    const { userId, key } = await getUserIdAndKey(request);

    if (!userId) return response.status(401).send({ error: 'Unauthorized' });

    await redisClient.del(key);

    return response.status(204).send();
  }
}

module.exports = AuthController;

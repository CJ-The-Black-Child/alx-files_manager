const ObjectId = require('mongodb');
const sha1 = require('sha1');
const Queue = require('bull');
const { usersCollection } = require('../utils/db');
const { getUser, getUserIdAndKey } = require('../utils/user');

const userQueue = new Queue('sending email');

class UsersController {
  static async postNew (req, res) {
    const { email, password } = req.body;

    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });

    const emailExists = await (await usersCollection()).findOne({ email });

    if (emailExists) return res.status(400).json({ error: 'Already exist' });

    const hashedPass = sha1(password);
    const insertionInfo = await (await usersCollection()).insertOne({ email, password: hashedPass });
    const userId = insertionInfo.insertedId.toString();

    userQueue.add({ userId });
    return res.status(201).json({ email, id: userId });
  }

  static async getMe (request, response) {
    const { userId } = await getUserIdAndKey(request);

    const user = await getUser({ _id: ObjectId(userId) });

    if (!user) return response.status(401).send({ error: 'Unauthorized' });

    const processedUser = { id: user._id, ...user };
    delete processedUser._id;
    delete processedUser.password;

    return response.status(200).send(processedUser);
  }
}

module.exports = UsersController;

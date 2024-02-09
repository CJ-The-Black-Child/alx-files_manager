const Queue = require('bull');
const { ObjectId } = require('mongodb');
const fsPromises = require('fs').promises;
const imageThumbnail = require('image-thumbnail');
const { getFile } = require('./utils/file');
const { getUser } = require('./utils/user');
const { isValidId } = require('./utils/basic');

const fileQueue = new Queue('fileQueue');
const userQueue = new Queue('userQueue');

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!userId || !fileId || !isValidId(fileId) || !isValidId(userId)) {
    throw new Error('Missing or invalid fileId or userId');
  }

  const file = await getFile({
    _id: ObjectId(fileId),
    userId: ObjectId(userId),
  });

  if (!file) throw new Error('File not found');

  const { localPath } = file;
  const options = {};
  const widths = [500, 250, 100];

  for (const width of widths) {
    options.width = width;
    try {
      const thumbnail = await imageThumbnail(localPath, options);
      await fsPromises.writeFile(`${localPath}_${width}`, thumbnail);
    } catch (err) {
      console.error(err.message);
    }
  }
});

userQueue.process(async (job) => {
  const { userId } = job.data;

  if (!userId || !isValidId(userId)) {
    throw new Error('Missing or invalid userId');
  }

  const user = await getUser({
    _id: ObjectId(userId),
  });

  if (!user) throw new Error('User not found');

  console.log(`Welcome ${user.email}!`);
});

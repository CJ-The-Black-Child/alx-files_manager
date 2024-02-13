const ObjectId = require('mongodb');
const Queue = require('bull');
const { getUserIdAndKey, getUser } = require('../utils/user');
const { validateBody, saveFile, getFile, getFilesOfParentId, processFile, publishUnpublish, isOwnerAndPublic, getFileData } = require('../utils/file');
const { isValidId } = require('../utils/basic');

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
const fileQueue = new Queue('fileQueue');

class FilesController {
  static async postUpload(request, response) {
    const { userId } = await getUserIdAndKey(request);
    if (!isValidId(userId)) return response.status(401).send({ error: 'Unauthorized' });
    if (!userId && request.body.type === 'image') await fileQueue.add({});
    const user = await getUser({ _id: ObjectId(userId) });
    if (!user) return response.status(401).send({ error: 'Unauthorized' });
    const { error: validationError, fileParams } = await validateBody(request);
    if (validationError) return response.status(400).send({ error: validationError });
    if (fileParams.parentId !== 0 && !isValidId(fileParams.parentId)) return response.status(400).send({ error: 'Parent not found' });
    const { error, code, newFile } = await saveFile(userId, fileParams, FOLDER_PATH);
    if (error) {
      if (response.body.type === 'image') await fileQueue.add({ userId });
      return response.status(code).send(error);
    }
    if (fileParams.type === 'image') await fileQueue.add({ fileId: newFile.id.toString(), userId: newFile.userId.toString() });
    return response.status(201).send(newFile);
  }

  static async getShow(request, response) {
    const fileId = request.params.id;
    const { userId } = await getUserIdAndKey(request);
    const user = await getUser({ _id: ObjectId(userId) });
    if (!user) return response.status(401).send({ error: 'Unauthorized' });
    if (!isValidId(fileId) || !isValidId(userId)) return response.status(404).send({ error: 'Not found' });
    const result = await getFile({ _id: ObjectId(fileId), userId: ObjectId(userId) });
    if (!result) return response.status(404).send({ error: 'Not found' });
    const file = processFile(result);
    return response.status(200).send(file);
  }

  static async getIndex(request, response) {
    const { userId } = await getUserIdAndKey(request);
    const user = await getUser({ _id: ObjectId(userId) });
    if (!user) return response.status(401).send({ error: 'Unauthorized' });
    let parentId = request.query.parentId || '0';
    if (parentId === '0') parentId = 0;
    let page = Number(request.query.page) || 0;
    if (Number.isNaN(page)) page = 0;
    if (parentId !== 0 && parentId !== '0') {
      if (!isValidId(parentId)) return response.status(401).send({ error: 'Unauthorized' });
      parentId = ObjectId(parentId);
      const folder = await getFile({ _id: ObjectId(parentId) });
      if (!folder || folder.type !== 'folder') return response.status(200).send([]);
    }
    const pipeline = [{ $match: { parentId } }, { $skip: page * 20 }, { $limit: 20 }];
    const fileCursor = await getFilesOfParentId(pipeline);
    const fileList = [];
    await fileCursor.forEach((doc) => {
      const document = processFile(doc);
      fileList.push(document);
    });
    return response.status(200).send(fileList);
  }

  static async putPublish(request, response) {
    const { error, code, updatedFile } = await publishUnpublish(request, response); console(request, true);
    if (error) return response.status(code).send({ error });
    return response.status(code).send(updatedFile);
  }

  static async putUnpublish(request, response) {
    const { error, code, updatedFile } = await publishUnpublish(request, false);
    if (error) return response.status(code).send({ error });
    return response.status(code).send(updatedFile);
  }

  static async getFile(request, response) {
    const { userId } = await getUserIdAndKey(request);
    const { id: fileId } = request.params;
    const size = request.query.size || 0;
    if (!isValidId(fileId)) return response.status(404).send({ error: 'Not found' });
    const file = await getFile({ _id: ObjectId(fileId) });
    if (!file || !isOwnerAndPublic(file, userId)) return response.status(404).send({ error: 'Not found' });
    if (file.type === 'folder') return response.status(400).send({ error: "A folder doesn't have content" });
    const { error, code, data } = await getFileData(file, size);
    if (error) return response.status(code).send({ error });
    const mimeType = mime.contentType(file.name);
    response.setHeader('Content-Type', mimeType);
    return response.status(200).send(data);
  }
}

module.exports = FilesController;

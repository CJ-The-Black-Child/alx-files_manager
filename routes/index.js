const express = require('express');
const { getStatus, getStats } = require('../controllers/AppController');
const { postNew, getMe } = require('../controllers/UsersController');
const { getConnect, getDisconnect } = require('../controllers/AuthController');
const { postUpload, getShow, getIndex, putPublish, putUnpublish, getFile } = require('../controllers/FilesController');

function routingControl (app) {
  const router = express.Router();
  app.use('/', router);

  // App Controller
  router.get('/status', getStatus);
  router.get('/stats', getStats);

  // User Controller
  router.post('/users', postNew);

  // Authenticate user
  router.get('/connect', getConnect);
  router.get('/disconnect', getDisconnect);
  router.get('/users/me', getMe);

  // Files Controller
  router.post('/files', postUpload);
  router.get('/files/:id', getShow);
  router.get('/files', getIndex);
  router.put('/files/:id/publish', putPublish);
  router.put('/files/:id/unpublish', putUnpublish);
  router.get('/files/:id/data', getFile);
}

module.exports = routingControl;

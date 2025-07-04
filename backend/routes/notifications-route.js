const express = require('express');
const notificationRouter = express.Router();
const {createNotification, saveFcm} = require('../controllers/notification-controller')
notificationRouter.post("/createNotification", createNotification)
notificationRouter.post("/save-token", saveFcm)
module.exports = notificationRouter;
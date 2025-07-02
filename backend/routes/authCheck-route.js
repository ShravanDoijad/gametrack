const express = require('express');
const authCheckRouter = express.Router();
const { authCheck } = require('../controllers/authCheck-controller');
const { userMiddleware } = require('../middleware/authMiddleware');

authCheckRouter.get('/authCheck', userMiddleware, authCheck);

module.exports = authCheckRouter;

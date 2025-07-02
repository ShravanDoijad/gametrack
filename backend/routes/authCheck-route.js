const express = require('express');
const { authCheck } = require('../controllers/authCheck-controller');
const { userMiddleware} = require('../middleware/authMiddleware')
const authCheckRouter = express.Router();

authCheckRouter.get('/',userMiddleware, authCheck);

module.exports = authCheckRouter;
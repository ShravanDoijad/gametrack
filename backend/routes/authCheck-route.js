const express = require('express');
const authCheckRouter = express.Router();
const { userAuthCheck, ownerAuthCheck, authCheck } = require('../controllers/authCheck-controller');
const { authMiddleware } = require('../middleware/authMiddleware');
const { ownerMiddleware } = require('../middleware/ownerMiddleware');

authCheckRouter.get('/authCheck', authMiddleware, authCheck);



module.exports = authCheckRouter;

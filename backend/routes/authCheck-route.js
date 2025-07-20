const express = require('express');
const authCheckRouter = express.Router();
const { userAuthCheck, ownerAuthCheck, authCheck } = require('../controllers/authCheck-controller');
const { userOrOwnerMiddleware } = require('../middleware/authMiddleware');
const { ownerMiddleware } = require('../middleware/ownerMiddleware');

authCheckRouter.get('/authCheck', userOrOwnerMiddleware, authCheck);



module.exports = authCheckRouter;

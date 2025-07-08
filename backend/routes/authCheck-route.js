const express = require('express');
const authCheckRouter = express.Router();
const { userAuthCheck, ownerAuthCheck } = require('../controllers/authCheck-controller');
const { userOrOwnerMiddleware } = require('../middleware/authMiddleware');
const { ownerMiddleware } = require('../middleware/ownerMiddleware');

authCheckRouter.get('/authCheck', userOrOwnerMiddleware, userAuthCheck);

authCheckRouter.get('/ownerAuthCheck', ownerMiddleware, ownerAuthCheck);

module.exports = authCheckRouter;

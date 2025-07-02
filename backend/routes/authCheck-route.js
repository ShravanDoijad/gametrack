const express = require('express');
const router = express.Router();
const { authCheck } = require('../controllers/authCheck-controller');
const { userMiddleware } = require('../middleware/authMiddleware');

router.get('/authCheck', userMiddleware, authCheck);

module.exports = router;

const express = require('express');
const { verifyOtp } = require('../controllers/otp-controller');
const verifyRouter = express.Router();



verifyRouter.post('/verifyOtp',verifyOtp )

module.exports = verifyRouter;
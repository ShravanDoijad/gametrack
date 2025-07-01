const express = require('express');
const { body } = require('express-validator');
const { ownerLogin } = require('../controllers/owner-controllers');

const ownerRouter = express.Router();
ownerRouter.post(
  '/ownerLogin',
  [
    body('email')
      .isEmail()
      .withMessage('Valid email is required'),
    
  ],
  
  ownerLogin
);

module.exports = ownerRouter;
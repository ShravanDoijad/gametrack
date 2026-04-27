const express = require('express');
const { handleIncomingMessage } = require('../controllers/whatsapp-controller');
const { razorpayWebhook } = require('../controllers/webhook-controller');

const botRouter = express.Router();

// Twilio webhook for incoming WhatsApp messages
botRouter.post('/whatsapp', handleIncomingMessage);

// Razorpay webhook for payment link successes
botRouter.post('/razorpay', express.json(), razorpayWebhook);

module.exports = botRouter;

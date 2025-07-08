const express = require('express');
const { body } = require('express-validator');
const { turfAllBookings, getCustomers, getTurfDetails, updateTurfProfile } = require('../controllers/owner-controllers');
const { ownerMiddleware} = require("../middleware/ownerMiddleware")
const ownerRouter = express.Router();


ownerRouter.get('/turfAllBookings', ownerMiddleware, turfAllBookings);
ownerRouter.get('/customers', ownerMiddleware, getCustomers)
ownerRouter.get('/turfDetails', ownerMiddleware, getTurfDetails)
ownerRouter.put('/updateTurfProfile',ownerMiddleware, updateTurfProfile); 

module.exports = ownerRouter
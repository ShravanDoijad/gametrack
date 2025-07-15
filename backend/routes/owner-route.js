const express = require('express');
const { body } = require('express-validator');
const { turfAllBookings, getCustomers, getTurfDetails, updateTurfProfile, getOwnedTurfs, ownerRegister, dashboardDetails, updateOwner } = require('../controllers/owner-controllers');
const { ownerMiddleware} = require("../middleware/ownerMiddleware")
const ownerRouter = express.Router();

ownerRouter.post("/register", ownerRegister)
ownerRouter.get('/turfAllBookings', ownerMiddleware, turfAllBookings);
ownerRouter.get('/customers', ownerMiddleware, getCustomers)
ownerRouter.get('/ownedTurfs', ownerMiddleware, getOwnedTurfs)
ownerRouter.get('/dashboardDetails', ownerMiddleware, dashboardDetails);
ownerRouter.get('/turfDetails', ownerMiddleware, getTurfDetails)
ownerRouter.put('/updateTurfProfile',ownerMiddleware, updateTurfProfile); 
ownerRouter.post('/updateOwner',ownerMiddleware, updateOwner )

module.exports = ownerRouter
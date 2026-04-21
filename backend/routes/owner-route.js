const express = require('express');
const { body } = require('express-validator');
const { turfAllBookings, getCustomers, getTurfDetails, updateTurfProfile, getOwnedTurfs, ownerRegister, dashboardDetails, updateOwner, deleteSlot, getSlots, addSlot, updateSlotStatus, getAvailableSlots, addManualBooking, cancelBooking, getSubscriptions, generatePdf, updateSubscriptionSlot } = require('../controllers/owner-controllers');
const {createTournament, updateTournament, deleteTournament, getTournaments}= require('../controllers/tournament-controller');
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

ownerRouter.get("/availableSlots", ownerMiddleware, getAvailableSlots)
ownerRouter.post("/addManualBooking", ownerMiddleware, addManualBooking)
ownerRouter.post('/cancelBooking', ownerMiddleware, cancelBooking);
ownerRouter.get('/subscriptions', ownerMiddleware, getSubscriptions);
ownerRouter.get('/generate-bookings-pdf', ownerMiddleware, generatePdf);
ownerRouter.put('/subscriptions/:id', ownerMiddleware, updateSubscriptionSlot );

ownerRouter.post('/tournament', ownerMiddleware, createTournament);
ownerRouter.put('/tournament/:id', ownerMiddleware, updateTournament);
ownerRouter.delete('/tournament/:id', ownerMiddleware, deleteTournament);
ownerRouter.get('/tournaments', ownerMiddleware, getTournaments);





module.exports = ownerRouter
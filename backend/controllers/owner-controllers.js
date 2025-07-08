const { sendOtp } = require("./otp-controller");
const { validationResult } = require('express-validator');
const Owner = require("../models/owner-model");
const Booking = require("../models/booking-model");
const User = require("../models/user-model");
const Turf = require("../models/turf-model")


const turfAllBookings = async (req, res) => {
    try {
         const { data: owner, role } = req.owner;
        const turfId = owner.turfId;

        if (!turfId) {
            return res.status(400).json({ success: false, message: "Turf ID is required" });
        }

        const bookings = await Booking.find({ turfId: turfId }).populate('userId', 'fullname email phone');
        console.log("bookings", bookings)
        res.status(200).json({ success: true, bookings });
    } catch (error) {
        console.error("Error fetching turf bookings:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


const getCustomers = async (req, res) => {
    try {
        const { data: owner, role } = req.owner;
        const turf = await Turf.findById(owner.turfId)
        if (!turf) {
            return res.status(404).json({ success: false, message: "Turf not found" });
        }
        const bookings = await Booking.find({ turfId: turf._id }).populate('userId', 'name email phone');
        if (!bookings || bookings.length === 0) {
            return res.status(404).json({ success: false, message: "No bookings found for this turf" });
        }


        const customers = bookings.map((booking) => ({
            userId: booking.userId._id,
            name: booking.userId.fullname,
            email: booking.userId.email,
            phone: booking.userId.phone,
            bookingDate: booking.date,
            slots: booking.slots,
            amountPaid: booking.amountPaid,
            paymentType: booking.paymentType,
            status: booking.status,
            bookingCreatedAt: booking.createdAt,
        }));

        res.status(200).json({ success: true, customers });
    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({ success: false, message: "Internal server error" });

    }
    
}

const getTurfDetails = async (req, res) => {
    try {
        const { data: owner, role } = req.owner;
        const turf = await Turf.findById(owner.turfId);
        if (!turf) {
            return res.status(404).json({ success: false, message: "Turf not found" });
        }
        res.status(200).json({ success: true, turf, owner });
    } catch (error) {
        console.error("Error fetching turf details:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const updateTurfProfile = async (req, res) => {
    try {
        const { data: owner, role } = req.owner;
        const turfId = owner.turfId;
        const turfData = req.body;

        const updatedTurf = await Turf.findByIdAndUpdate(turfId, turfData, { new: true });
        if (!updatedTurf) {
            return res.status(404).json({ success: false, message: "Turf not found" });
        }

        res.status(200).json({ success: true, turf: updatedTurf });
    } catch (error) {
        console.error("Error updating turf profile:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


module.exports = {

    turfAllBookings,
    getCustomers,
    getTurfDetails,
    updateTurfProfile
};
const { sendOtp } = require("./otp-controller");
const { validationResult } = require('express-validator');
const Owner = require("../models/owner-model");
const Booking = require("../models/booking-model");
const User = require("../models/user-model");
const Turf = require("../models/turf-model")
const bcrypt = require('bcryptjs');


const ownerRegister = async (req, res) => {
    try {
        const { fullname, email, phone, turfId, turfname } = req.body;

        // Basic validation
        if (!fullname || !email || !phone  || !turfId || !turfname) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // Check if owner already exists
        const existingOwner = await Owner.findOne({ $or: [{ email }, { phone }] });
        if (existingOwner) {
            return res.status(409).json({
                success: false,
                message: "Owner already exists with this email or phone",
            });
        }

       

        // Create owner
        const newOwner = new Owner({
            fullname,
            email,
            phone,
            
            turfId,
            turfname,
        });

        await newOwner.save();

        return res.status(201).json({
            success: true,
            message: "Owner registered successfully",
            owner: {
                id: newOwner._id,
                fullname: newOwner.fullname,
                email: newOwner.email,
                phone: newOwner.phone,
                turfId: newOwner.turfId,
                turfname: newOwner.turfname,
            },
        });
    } catch (error) {
        console.error("Owner registration error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

module.exports = { ownerRegister };


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
        console.log("Ownerbookings", bookings)
        if (!bookings || bookings.length === 0) {
            return res.status(404).json({ success: false, message: "No bookings found for this turf" });
        }


        const customers = bookings
            .filter((booking) => booking.userId !== null)
            .map((booking) => ({
                userId: booking.userId._id,
                name: booking.userId.fullname || "Geust",
                email: booking.userId.email || "N/A",
                phone: booking.userId.phone || "N/A",
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
}

const getOwnedTurfs = async (req, res) => {
    try {
        const { data: owner, role } = req.owner;
        if (!owner || !owner.turfId) {
            return res.status(400).json({ success: false, message: "Owner or Turf ID not found" });
        }
        const turfs = await Turf.find({ owner: owner._id });
        if (!turfs || turfs.length === 0) {
            return res.status(404).json({ success: false, message: "No turfs found" });
        }
        res.status(200).json({ success: true, turfs });
    } catch (error) {
        console.error("Error fetching turfs:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

const dashboardDetails= async (req, res) => {
  try {
    const {turfId} = req.query
    if (!turfId) {
      return res.status(400).json({ success: false, message: "Turf ID is required" });
    }
    const bookings = await Booking.find({ turfId: turfId })
    const details = []
    bookings.forEach((booking) => {
      details.push({
        userId: booking.userId,
        date: booking.date,
        slots: booking.slots,
        slotFees: booking.slotFees,
        amountPaid: booking.amountPaid,
        paymentType: booking.paymentType,
        status: booking.status,
        createdAt: booking.createdAt
      })
    })
    res.status(200).json({ success: true, details });
  }
  catch{
    console.error("Error fetching dashboard details:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

const updateOwner = async (req, res) => {
  try {
    const { ownerId, playerId } = req.body;
    if (!ownerId || !playerId) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    const updatedOwner = await Owner.findByIdAndUpdate(ownerId, {
      fcmToken: playerId,
    }, { new: true });

    console.log("✅ Owner updated:", updatedOwner);
    res.json({ success: true });
  } catch (error) {
    console.error("🔥 Update Owner Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};



module.exports = {

    turfAllBookings,
    getCustomers,
    getTurfDetails,
    updateTurfProfile,
    getOwnedTurfs,
    ownerRegister,
    dashboardDetails,
    updateOwner

};
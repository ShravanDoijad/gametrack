const { sendOtp } = require("./otp-controller");
const { validationResult } = require('express-validator');
const Owner = require("../models/owner-model");
const Booking = require("../models/booking-model");
const User = require("../models/user-model");
const Turf = require("../models/turf-model")
const bcrypt = require('bcryptjs');


const ownerRegister = async (req, res) => {
  try {
    const { fullname, email, phone, turfIds, turfname } = req.body;

    // Basic validation
    if (!fullname?.trim() || !email?.trim() || !phone?.trim() || !Array.isArray(turfIds) || turfIds.length === 0 || !turfname?.trim()) {
      return res.status(400).json({
        success: false,
        message: "All fields are required and turfIds must be a non-empty array",
      });
    }

    // Check if owner already exists
    const existingOwner = await Owner.findOne({
      $or: [{ email: email.trim() }, { phone: phone.trim() }],
    });

    if (existingOwner) {
      return res.status(409).json({
        success: false,
        message: "Owner already exists with this email or phone",
      });
    }

    // Create owner
    const newOwner = new Owner({
      fullname: fullname.trim(),
      email: email.trim(),
      phone: phone.trim(),
      turfIds,
      turfname: turfname.trim(),
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
        turfIds: newOwner.turfIds,
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





const turfAllBookings = async (req, res) => {
    try {
        const { turfId } = req.query

        if (!turfId) {
            return res.status(400).json({ success: false, message: "Turf ID is required" });
        }

        const bookings = await Booking.find({ turfId: turfId }).populate('userId', 'fullname email phone');

        res.status(200).json({ success: true, bookings });
    } catch (error) {
        console.error("Error fetching turf bookings:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


const getCustomers = async (req, res) => {
    try {
        const { turfId } = req.query;
        const turf = await Turf.findById(turfId)
        if (!turf) {
            return res.status(404).json({ success: false, message: "Turf not found" });
        }
        const bookings = await Booking.find({ turfId: turf._id }).populate('userId', 'name email phone');

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
        const { data: owner, role } = req.auth;
        const {turfId} = req.query
        const turf = await Turf.findById(turfId);
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
        const { data: owner, role } = req.auth;
        const {turfId} = req.query;
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
        const { data: owner, role } = req.auth;
        if (!owner || !owner.turfIds.length>0) {
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

const dashboardDetails = async (req, res) => {
    try {
        const { turfId } = req.query
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
    catch {
        console.error("Error fetching dashboard details:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

const updateOwner = async (req, res) => {
    try {
        const { ownerId, fcmToken } = req.body;

        if (!ownerId || !fcmToken) {
            return res.status(400).json({ success: false, message: "Missing data" });
        }

        await Owner.findByIdAndUpdate(ownerId, {
            $addToSet: { fcmTokens: fcmToken },
        });
        res.json({ success: true });
    } catch (error) {
        console.error("🔥 Update Owner Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const convertToMilitaryTime = (timeStr) => {
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  let slot
  if(hours<10){
   slot = "0"+hours+":"+"00"
  }
  else{
    slot = hours+":"+"00"
  }
  return slot; // 1:30 PM -> 1330
};



const updateSlotStatus = async (req, res) => {
  let { date, turfId, start, end, newStatus } = req.body;
  start = convertToMilitaryTime(start);
  end = convertToMilitaryTime(end);
  console.log("start", start)
    
  try {
    const turf = await Turf.findById(turfId);
    if (!turf) return res.status(404).json({ message: "Turf not found" });

    let day = turf.bookedSlots.find((d) => d.date === date);

    if (newStatus === "booked") {
      // 1. Check if any existing slot overlaps
      if (day) {
        const hasOverlap = day.slots.some(
          (slot) =>
            (start >= slot.start && start < slot.end) ||
            (end > slot.start && end <= slot.end) ||
            (start <= slot.start && end >= slot.end) // complete overlap
        );
        if (hasOverlap) {
          return res.status(409).json({ message: "This slot overlaps with an already booked slot." });
        }

        
        day.slots.push({ start, end });
      } else {
       
        turf.bookedSlots.push({
          date,
          slots: [{ start, end }],
        });
      }
    } else if (newStatus === "available") {
      // Make available: remove from turf.bookedSlots and update booking collection status
      if (!day) return res.status(404).json({ message: "No booked slots for this date" });

      const index = day.slots.findIndex((s) => s.start === start && s.end === end);
      if (index === -1) return res.status(404).json({ message: "Slot not found" });

      // Remove from turf's booked slots
      day.slots.splice(index, 1);
      if (day.slots.length === 0) {
        turf.bookedSlots = turf.bookedSlots.filter((d) => d.date !== date);
      }

      // Also update booking document status to "cancelled"
      await Booking.updateOne(
        {
          turfId,
          date,
          "slots.start": start,
          "slots.end": end,
          status: "confirmed"
        },
        { $set: { status: "cancelled" } }
      );
    }

    await turf.save();
    return res.status(200).json({ message: "Slot status updated successfully" });

  } catch (err) {
    console.error("Error updating slot status:", err);
    res.status(500).json({ message: "Server error" });
  }
};




const getAvailableSlots = async (req, res) => {
  try {
    const { turfId, date } = req.query;

    if (!date) return res.status(400).json({ error: "Date is required." });

    const turf = await Turf.findById(turfId);
    if (!turf) return res.status(404).json({ error: "Turf not found." });

    const { openingTime, closingTime, bookedSlots } = turf;

    const allSlots = generateSlots(openingTime, closingTime);
    const bookedDay = bookedSlots.find((s) => s.date === date);
    const bookedTime = bookedDay?.slots || [];

    const slotsWithStatus = allSlots.map((slot) => {
      const isBooked = bookedTime.some(
        (b) =>
          (slot.start >= b.start && slot.start < b.end) ||
          (slot.end > b.start && slot.end <= b.end) ||
          (slot.start <= b.start && slot.end >= b.end)
      );

      return {
        ...slot,
        status: isBooked ? "booked" : "available",
      };
    });

    res.json({ slots: slotsWithStatus });
  } catch (err) {
    console.error("Error getting slots:", err);
    res.status(500).json({ error: "Server error" });
  }
};



function generateSlots(openingTime, closingTime) {
    const slots = [];
    let [hour, minute] = openingTime.split(":").map(Number);
    const [endHour, endMinute] = closingTime.split(":").map(Number);

    while (hour < endHour || (hour === endHour && minute < endMinute)) {
        const startHour = hour.toString().padStart(2, "0");
        const startMin = minute.toString().padStart(2, "0");

        hour += 1;

        const endHourStr = hour.toString().padStart(2, "0");
        const endMin = startMin;

        slots.push({
            start: `${startHour}:${startMin}`,
            end: `${endHourStr}:${endMin}`,
            _id: `${startHour}${startMin}-${endHourStr}${endMin}` // string ID
        });
    }

    return slots;
}


module.exports = {

    turfAllBookings,
    getCustomers,
    getTurfDetails,
    updateTurfProfile,
    getOwnedTurfs,
    ownerRegister,
    dashboardDetails,
    updateOwner,
 
    updateSlotStatus,
    getAvailableSlots


};
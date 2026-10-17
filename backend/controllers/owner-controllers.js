const { sendOtp } = require("./otp-controller");
const { validationResult } = require('express-validator');
const Owner = require("../models/owner-model");
const Booking = require("../models/booking-model");
const User = require("../models/user-model");
const Turf = require("../models/turf-model")
const { getTurfId } = require("./single-turf");
const bcrypt = require('bcryptjs');
const Subscription = require("../models/subscription-model");
const { calculateBookingTotal } = require("../utils/booking-pricing");
const { sendMessage, OwnerUpdate, UserSubscriptionUpdate, OwnerSubscriptionUpdate, sendWhatsAppTemplate } = require('../twilio/sendMessage');
const PDFDocument = require('pdfkit');

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

    let bookings = await Booking.find({ turfId: turfId }).populate('userId', 'fullname email phone');



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
    const { turfId } = req.query
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
    const { data: owner } = req.auth;
    const { turfId } = req.query;
    if (!turfId || !owner?._id) {
      return res.status(400).json({ success: false, message: "Turf ID is required" });
    }
    const allowedFields = ["name", "dayPrice", "nightPrice", "openingTime", "closingTime", "nightPriceStart"];
    const turfData = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        turfData[field] = req.body[field];
      }
    }
    if (req.body.location && typeof req.body.location === "object") {
      for (const field of ["address", "city", "pincode"]) {
        if (Object.prototype.hasOwnProperty.call(req.body.location, field)) {
          turfData[`location.${field}`] = req.body.location[field];
        }
      }
    }

    const updatedTurf = await Turf.findOneAndUpdate(
      { _id: turfId, owner: owner._id },
      { $set: turfData },
      { new: true, runValidators: true }
    );
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
    if (!owner) {
      return res.status(401).json({ success: false, message: "Owner account not found" });
    }
    const turfIds = owner.turfIds || [];
    const turfs = turfIds.length
      ? await Turf.find({ _id: { $in: turfIds }, owner: owner._id })
      : [];
    return res.status(200).json({ success: true, turfs });
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

const reserveOwnerBookingSlot = async (turfId, date, slot) => {
  const overlap = { start: { $lt: slot.end }, end: { $gt: slot.start } };
  const existingDate = await Turf.updateOne(
    {
      _id: turfId,
      $nor: [{
        subscriptionSlots: {
          $elemMatch: {
            fromDate: { $lte: date },
            toDate: { $gte: date },
            "slot.start": { $lt: slot.end },
            "slot.end": { $gt: slot.start },
          },
        },
      }],
      bookedSlots: {
        $elemMatch: {
          date,
          status: { $ne: "unavailable" },
          slots: { $not: { $elemMatch: overlap } },
        },
      },
    },
    { $push: { "bookedSlots.$.slots": slot } }
  );
  if (existingDate.modifiedCount === 1) return true;

  const newDate = await Turf.updateOne(
    {
      _id: turfId,
      $nor: [{
        subscriptionSlots: {
          $elemMatch: {
            fromDate: { $lte: date },
            toDate: { $gte: date },
            "slot.start": { $lt: slot.end },
            "slot.end": { $gt: slot.start },
          },
        },
      }],
      bookedSlots: { $not: { $elemMatch: { date } } },
    },
    { $push: { bookedSlots: { date, slots: [slot], status: "booked" } } }
  );
  return newDate.modifiedCount === 1;
};

const addManualBooking = async (req, res) => {
  let reserved = false;
  let booking = null;
  try {
    const {
      phone, fullname, date, start, end, turfId, advanceAmount = 0,
      paymentMethod = "cash", sport = "General", notes = "",
    } = req.body;
    const cleanName = String(fullname || "").trim();
    const cleanPhone = String(phone || "").replace(/[^+0-9]/g, "");
    if (!cleanName || !cleanPhone || cleanName.length > 100 || cleanPhone.replace(/\D/g, "").length < 8 || cleanPhone.length > 16) {
      return res.status(400).json({ success: false, message: "Enter the customer&#39;s name and a valid mobile number." });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "") || !/^\d{2}:\d{2}$/.test(start || "") || !/^\d{2}:\d{2}$/.test(end || "")) {
      return res.status(400).json({ success: false, message: "Choose a valid date and time slot." });
    }
    const startMinute = Number(start.slice(0, 2)) * 60 + Number(start.slice(3, 5));
    const endMinute = Number(end.slice(0, 2)) * 60 + Number(end.slice(3, 5));
    if (startMinute >= 1440 || endMinute > 1440 || endMinute <= startMinute) {
      return res.status(400).json({ success: false, message: "The end time must be after the start time." });
    }
    if (!["cash", "upi", "other"].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Choose a supported payment method." });
    }

    const turf = await Turf.findById(turfId).populate("owner", "phone");
    if (!turf) return res.status(404).json({ success: false, message: "Turf not found." });
    const total = calculateBookingTotal({ ...turf.toObject(), start, end });
    const received = Number(advanceAmount);
    if (total === null || total <= 0 || !Number.isFinite(received) || received < 0 || received > total) {
      return res.status(400).json({ success: false, message: "The received amount must be between 0 and the booking total." });
    }

    reserved = await reserveOwnerBookingSlot(turf._id, date, { start, end });
    if (!reserved) return res.status(409).json({ success: false, message: "That slot was just booked or blocked. Refresh the schedule and choose another time." });

    const ownerId = req.auth?.data?._id;
    booking = await Booking.create({
      turfId: turf._id,
      fullname: cleanName,
      phone: cleanPhone,
      date: new Date(`${date}T00:00:00.000Z`),
      slots: [{ start, end }],
      slotFees: total,
      amountPaid: received,
      paymentType: "Manual",
      status: "confirmed",
      sport: String(sport || "General").slice(0, 40),
      notes: String(notes || "").slice(0, 500),
      paymentHistory: received > 0 ? [{ amount: received, method: paymentMethod, receivedAt: new Date(), recordedBy: ownerId }] : [],
    });

    // Customer and owner notifications are best-effort after the booking is safely stored.
    try {
      await sendMessage({
      phoneNumber: cleanPhone,
      notification_data: {
        customerName: cleanName,
        turfName: turf.name,
        date: new Date(`${date}T00:00:00.000Z`).toLocaleDateString("en-IN", {
          dateStyle: "long",
          timeZone: "UTC",
        }),
        startTime: start,
        endTime: end,
        bookingReference: String(booking._id).slice(-8).toUpperCase(),
        totalAmount: total,
        advancePaid: received,
        remainingAmount: total - received,
        contactPhone: turf.owner?.phone,
        website: "https://gametrack.in",
      },
      });
    } catch (notificationError) {
      console.error("Manual booking saved, but customer notification failed:", notificationError.message);
    }

    try {
      if (turf.owner?.phone) {
        await OwnerUpdate({
          phoneNumber: turf.owner.phone,
          notification_data: {
            user: cleanName,
            phone: cleanPhone,
            bookingReference: String(booking._id).slice(-8).toUpperCase(),
            date: new Date(`${date}T00:00:00.000Z`).toDateString(),
            slotStart: start,
            slotEnd: end,
            duration: ((endMinute - startMinute) / 60).toFixed(1),
            sport,
            total,
            advance: received,
            remained: total - received,
          },
        });
      }
    } catch (notificationError) {
      console.error("Manual booking saved, but owner notification failed:", notificationError.message);
    }

    return res.status(201).json({ success: true, message: "Booking confirmed.", booking });
  } catch (error) {
    if (booking?._id) await Booking.deleteOne({ _id: booking._id }).catch(() => {});
    if (reserved && req.body?.turfId && req.body?.date) {
      await Turf.updateOne(
        { _id: req.body.turfId },
        { $pull: { "bookedSlots.$[day].slots": { start: req.body.start, end: req.body.end } } },
        { arrayFilters: [{ "day.date": req.body.date }] }
      ).catch(() => {});
    }
    console.error("Manual booking failed:", error.message);
    return res.status(500).json({ success: false, message: "We could not save this booking. Please check your connection and try again." });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { bookingId, date, turfId, start, end } = req.body;


    if (!bookingId || !date || !turfId) {
      return res.status(400).json({ success: false, message: "Booking ID, date, slot ID, and turf ID are required" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    const bookingDate = booking.date instanceof Date ? booking.date.toISOString().slice(0, 10) : String(booking.date).slice(0, 10);
    if (String(booking.turfId) !== String(turfId) || bookingDate !== date ||
        !booking.slots?.some((slot) => slot.start === start && slot.end === end)) {
      return res.status(403).json({ success: false, message: "Booking does not belong to this turf or slot" });
    }
    if (booking.status === "cancelled") return res.status(409).json({ success: false, message: "Booking is already cancelled" });

    const turf = await Turf.findById(turfId);
    if (!turf) {
      return res.status(404).json({ success: false, message: "Turf not found" });
    }

    const day = turf.bookedSlots.find((d) => d.date === date);
    if (!day) {
      return res.status(404).json({ success: false, message: "No booked slots for this date" });
    }

    const slotIndex = day.slots.findIndex((s) => s.start === start && s.end === end);
    if (slotIndex === -1) {
      return res.status(404).json({ success: false, message: "Slot not found" });
    }
    day.slots.splice(slotIndex, 1);
    if (day.slots.length === 0) {
      turf.bookedSlots = turf.bookedSlots.filter((d) => d.date !== date);
    }
    await turf.save();

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({ success: true, message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

const recordBookingPayment = async (req, res) => {
  try {
    const { turfId, amount, method, reference } = req.body;
    const receivedAmount = Number(amount);
    if (!turfId || !Number.isFinite(receivedAmount) || receivedAmount <= 0 || !["cash", "upi", "other"].includes(method)) {
      return res.status(400).json({ success: false, message: "Enter a valid amount and payment method." });
    }

    const result = await Booking.updateOne(
      {
        _id: req.params.bookingId,
        turfId,
        status: { $ne: "cancelled" },
        $expr: {
          $lte: [
            { $add: [{ $ifNull: ["$amountPaid", 0] }, receivedAmount] },
            "$slotFees",
          ],
        },
      },
      {
        $inc: { amountPaid: receivedAmount },
        $push: {
          paymentHistory: {
            amount: receivedAmount,
            method,
            receivedAt: new Date(),
            recordedBy: req.auth.data._id,
            reference: String(reference || "").trim().slice(0, 100),
          },
        },
      }
    );
    if (result.modifiedCount !== 1) {
      const booking = await Booking.findOne({ _id: req.params.bookingId, turfId });
      if (!booking) return res.status(404).json({ success: false, message: "Booking not found." });
      if (booking.status === "cancelled") return res.status(409).json({ success: false, message: "A cancelled booking cannot receive a payment." });
      return res.status(400).json({ success: false, message: "The payment is greater than the remaining balance." });
    }
    const booking = await Booking.findById(req.params.bookingId).populate("userId", "fullname phone");
    return res.status(200).json({ success: true, booking, message: "Payment recorded." });
  } catch (error) {
    console.error("Could not record booking payment:", error.message);
    return res.status(500).json({ success: false, message: "We couldn’t record that payment. Please try again." });
  }
};

const getSubscriptions = async (req, res) => {
  try {
    const { turfId } = req.query;
    if (!turfId) {
      return res.status(400).json({ success: false, message: "Turf ID is required" });
    }
    const subscription = await Subscription.find({ turfId: turfId }).populate('userId', 'fullname, email, phone') || [];
    if (!subscription) {
      return res.status(404).json({ success: false, message: "subscription not found" });
    }
    res.status(200).json({ success: true, subscription });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }

}

const generatePdf = async (req, res) => {
  try {
    const { turfId, month, year } = req.query;
    const monthNumber = Number(month);
    const yearNumber = Number(year);
    if (!turfId || !Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12 ||
        !Number.isInteger(yearNumber) || yearNumber < 2000 || yearNumber > 9999) {
      return res.status(400).json({ success: false, message: "Choose a valid turf and report month." });
    }

    const turf = await Turf.findById(turfId).select("name location");
    if (!turf) return res.status(404).json({ success: false, message: "Turf not found." });

    // Booking dates are saved at UTC midnight, so use a UTC half-open month range.
    const startDate = new Date(Date.UTC(yearNumber, monthNumber - 1, 1));
    const endDate = new Date(Date.UTC(yearNumber, monthNumber, 1));
    const bookings = await Booking.find({
      turfId,
      date: { $gte: startDate, $lt: endDate },
    }).populate("userId", "fullname email phone").sort({ date: 1, _id: 1 });

    const reportMonth = startDate.toLocaleDateString("en-IN", {
      month: "long", year: "numeric", timeZone: "UTC",
    });
    const money = (value) => `INR ${(Number(value) || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
    const activeBookings = bookings.filter((booking) => booking.status !== "cancelled");
    const collected = activeBookings.reduce((sum, booking) => sum + (Number(booking.amountPaid) || 0), 0);
    const outstanding = activeBookings.reduce((sum, booking) =>
      sum + Math.max(0, (Number(booking.slotFees) || 0) - (Number(booking.amountPaid) || 0)), 0);
    const confirmedCount = bookings.filter((booking) => booking.status === "confirmed").length;
    const cancelledCount = bookings.filter((booking) => booking.status === "cancelled").length;

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 34, bottom: 36, left: 40, right: 40 },
      bufferPages: true,
      info: {
        Title: `${turf.name} bookings - ${reportMonth}`,
        Author: "GameTrack",
        Subject: "Monthly booking and payment report",
      },
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="gametrack-bookings-${yearNumber}-${String(monthNumber).padStart(2, "0")}.pdf"`);
    doc.pipe(res);

    const colors = {
      ink: "#17212B",
      muted: "#64748B",
      green: "#176B50",
      greenLight: "#EAF5EF",
      border: "#DCE4E8",
      row: "#F5F8F8",
      white: "#FFFFFF",
      red: "#B42318",
    };
    const pageWidth = doc.page.width;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;

    doc.rect(0, 0, pageWidth, 8).fill(colors.green);
    doc.fillColor(colors.green).font("Helvetica-Bold").fontSize(10)
      .text("GAMETRACK  /  OWNER REPORT", margin, 28, { characterSpacing: 0.7 });
    doc.fillColor(colors.ink).fontSize(23)
      .text("Monthly bookings", margin, 48, { width: contentWidth * 0.65 });
    doc.fillColor(colors.muted).font("Helvetica").fontSize(10)
      .text(`${turf.name}${turf.location?.city ? `  |  ${turf.location.city}` : ""}`, margin, 78, { width: contentWidth * 0.65 });
    doc.fillColor(colors.muted).fontSize(9)
      .text(`${reportMonth}  |  Generated ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}`, margin, 94, { width: contentWidth });

    const cardY = 119;
    const gap = 10;
    const cardWidth = (contentWidth - gap * 3) / 4;
    const stats = [
      { label: "TOTAL BOOKINGS", value: String(bookings.length), note: `${cancelledCount} cancelled` },
      { label: "CONFIRMED", value: String(confirmedCount), note: "Confirmed reservations" },
      { label: "COLLECTED", value: money(collected), note: "Active bookings only" },
      { label: "OUTSTANDING", value: money(outstanding), note: "Remaining active balance" },
    ];
    stats.forEach((stat, index) => {
      const x = margin + index * (cardWidth + gap);
      doc.roundedRect(x, cardY, cardWidth, 62, 8).fill(index === 2 ? colors.greenLight : colors.row);
      doc.fillColor(colors.muted).font("Helvetica-Bold").fontSize(7.5)
        .text(stat.label, x + 12, cardY + 10, { width: cardWidth - 24 });
      doc.fillColor(index === 2 ? colors.green : colors.ink).font("Helvetica-Bold").fontSize(14)
        .text(stat.value, x + 12, cardY + 25, { width: cardWidth - 24, ellipsis: true, lineBreak: false });
      doc.fillColor(colors.muted).font("Helvetica").fontSize(7.5)
        .text(stat.note, x + 12, cardY + 46, { width: cardWidth - 24, ellipsis: true, lineBreak: false });
    });

    const columns = [
      { label: "BOOKING", width: 68 },
      { label: "DATE & TIME", width: 142 },
      { label: "CUSTOMER", width: 184 },
      { label: "TOTAL", width: 96, align: "right" },
      { label: "PAID", width: 96, align: "right" },
      { label: "DUE", width: 96, align: "right" },
      { label: "STATUS", width: 80, align: "center" },
    ];
    const tableWidth = columns.reduce((sum, column) => sum + column.width, 0);
    const tableX = margin + (contentWidth - tableWidth) / 2;
    const headerHeight = 28;
    const rowHeight = 39;
    let y = 198;

    const drawTableHeader = () => {
      doc.roundedRect(tableX, y, tableWidth, headerHeight, 5).fill(colors.ink);
      let x = tableX;
      columns.forEach((column) => {
        doc.fillColor(colors.white).font("Helvetica-Bold").fontSize(7.5)
          .text(column.label, x + 8, y + 10, {
            width: column.width - 16,
            align: column.align || "left",
            lineBreak: false,
          });
        x += column.width;
      });
      y += headerHeight;
    };
    const drawFooter = (page, pages) => {
      doc.moveTo(margin, doc.page.height - 27).lineTo(pageWidth - margin, doc.page.height - 27)
        .strokeColor(colors.border).lineWidth(0.6).stroke();
      doc.fillColor(colors.muted).font("Helvetica").fontSize(8)
        .text("GameTrack  |  Booking and payment report", margin, doc.page.height - 19, { lineBreak: false });
      doc.text(`Page ${page} of ${pages}`, pageWidth - margin - 100, doc.page.height - 19, {
        width: 100, align: "right", lineBreak: false,
      });
    };
    drawTableHeader();

    if (bookings.length === 0) {
      doc.roundedRect(tableX, y + 8, tableWidth, 72, 7).fill(colors.row);
      doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(12)
        .text("No bookings for this month", tableX + 14, y + 29, { width: tableWidth - 28, align: "center" });
      doc.fillColor(colors.muted).font("Helvetica").fontSize(9)
        .text("Choose another month to export its booking activity.", tableX + 14, y + 49, { width: tableWidth - 28, align: "center" });
    } else {
      bookings.forEach((booking, index) => {
        if (y + rowHeight > doc.page.height - 44) {
          doc.addPage();
          y = 38;
          doc.fillColor(colors.green).font("Helvetica-Bold").fontSize(9)
            .text(`MONTHLY BOOKINGS  |  ${turf.name}  |  ${reportMonth}`, margin, y, { width: contentWidth, lineBreak: false });
          y += 22;
          drawTableHeader();
        }

        if (index % 2 === 0) doc.rect(tableX, y, tableWidth, rowHeight).fill(colors.row);
        doc.moveTo(tableX, y + rowHeight).lineTo(tableX + tableWidth, y + rowHeight)
          .strokeColor(colors.border).lineWidth(0.4).stroke();

        const customerName = booking.userId?.fullname || booking.fullname || "Guest";
        const phone = booking.userId?.phone || booking.phone || "Phone not provided";
        const bookingDate = new Date(booking.date).toLocaleDateString("en-IN", {
          day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
        });
        const slots = (booking.slots || []).map((slot) => `${slot.start || ""}-${slot.end || ""}`).filter(Boolean).join(", ") || "Time not set";
        const total = Number(booking.slotFees) || 0;
        const paid = Number(booking.amountPaid) || 0;
        const due = booking.status === "cancelled" ? 0 : Math.max(0, total - paid);
        const values = [
          { main: String(booking._id || "").slice(-7).toUpperCase(), sub: "Reference" },
          { main: bookingDate, sub: slots },
          { main: customerName, sub: phone },
          { main: money(total), sub: "" },
          { main: money(paid), sub: booking.paymentType === "Manual" ? "Manual payment" : "Received" },
          { main: money(due), sub: "" },
          { main: booking.status || "pending", sub: "" },
        ];
        let x = tableX;
        values.forEach((value, columnIndex) => {
          const column = columns[columnIndex];
          const align = column.align || "left";
          const textX = x + (align === "right" ? 4 : 8);
          const textWidth = column.width - (align === "right" ? 12 : 16);
          const isStatus = columnIndex === 6;
          doc.fillColor(isStatus && booking.status === "cancelled" ? colors.red : colors.ink)
            .font(isStatus ? "Helvetica-Bold" : "Helvetica-Bold").fontSize(isStatus ? 8 : 8.5)
            .text(value.main, textX, y + 8, { width: textWidth, align, ellipsis: true, lineBreak: false });
          if (value.sub) {
            doc.fillColor(colors.muted).font("Helvetica").fontSize(7.2)
              .text(value.sub, textX, y + 22, { width: textWidth, align, ellipsis: true, lineBreak: false });
          }
          x += column.width;
        });
        y += rowHeight;
      });
    }

    const range = doc.bufferedPageRange();
    for (let index = range.start; index < range.start + range.count; index += 1) {
      doc.switchToPage(index);
      drawFooter(index + 1, range.count);
    }
    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    if (!res.headersSent) return res.status(500).json({ success: false, message: "Could not generate the bookings report." });
    res.end();
  }
};

const updateSubscriptionSlot = async (req, res) => {
  try {
    const payload = req.body;
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "Subscription ID is required" });
    }
    const updatedSubscription = await Subscription.findByIdAndUpdate(id, payload, { new: true });
    if (!updatedSubscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }
    res.status(200).json({ success: true, subscription: updatedSubscription });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }

}

const addManualSubscription = async (req, res) => {
  try {
    let { phone, fullname, advanceAmount, startDate, durationDays, start, end, turfId, slotFees, sport, newStatus } = req.body;

    if (!phone || !fullname || !startDate || !durationDays || !start || !end || !turfId || !sport) {
      return res.status(400).json({ message: "All fields are required for subscription" });
    }

    if (!advanceAmount) {
      advanceAmount = 0;
    }

    const turf = await Turf.findById(turfId).populate('owner', 'phone');
    if (!turf) return res.status(404).json({ message: "Turf not found" });

    // Calculate end date based on durationDays
    const startDt = new Date(startDate);
    const endDt = new Date(startDt);
    endDt.setDate(endDt.getDate() + parseInt(durationDays) - 1);

    const formattedEndDate = endDt.toISOString().split('T')[0];
    const formattedStartDate = startDt.toISOString().split('T')[0];

    if (newStatus === "booked") {
      // Add to Turf's subscriptionSlots
      turf.subscriptionSlots.push({
        fromDate: formattedStartDate,
        toDate: formattedEndDate,
        slot: { start, end }
      });

      await turf.save();

      // Create Subscription document
      const newSubscription = await Subscription.create({
        turfId: turfId,
        fullname: fullname,
        phone: phone,
        startDate: startDt,
        endDate: endDt,
        durationDays: parseInt(durationDays),
        slot: { start, end },
        daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], // Default to everyday
        sport: sport,
        amountPaid: advanceAmount,
        totalAmount: slotFees,
        paymentType: "full",
        status: "active"
      });

      const timeStringToMinutes = time => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
      };

      // Use the approved subscription templates for both subscription notifications.
      await UserSubscriptionUpdate({
        phoneNumber: phone,
        notification_data: {
          name: fullname,
          turfName: turf.name,
          fromDate: formattedStartDate,
          toDate: formattedEndDate,
          totalDays: durationDays,
          slotStart: start,
          slotEnd: end,
          duration: ((timeStringToMinutes(end) - timeStringToMinutes(start)) / 60).toFixed(1),
          sport,
          total: slotFees,
          advance: advanceAmount,
          remaining: slotFees - advanceAmount,
        },
      });

      await OwnerSubscriptionUpdate({
        phoneNumber: turf.owner.phone,
        notification_data: {
          user: fullname,
          userPhone: phone,
          fromDate: formattedStartDate,
          toDate: formattedEndDate,
          totalDays: durationDays,
          slotStart: start,
          slotEnd: end,
          duration: ((timeStringToMinutes(end) - timeStringToMinutes(start)) / 60).toFixed(1),
          total: slotFees,
          advance: advanceAmount,
          remaining: slotFees - advanceAmount,
        },
      });

      return res.status(200).json({ message: "Subscription created successfully", subscription: newSubscription });
    } else {
      return res.status(400).json({ message: "Invalid status for manual subscription creation" });
    }
  } catch (error) {
    console.log("Manual Subscription Error", error);
    res.status(500).json({ message: "Manual Subscription Error" });
  }
};

const sendWhatsAppCampaign = async (req, res) => {
  try {
    const { turfId, targets, discountAmount, offerDay, expiryDate, link } = req.body;

    if (!turfId) {
      return res.status(400).json({ success: false, message: "A turf is required for this campaign." });
    }

    const turf = await Turf.findOne({ _id: turfId, owner: req.auth.data._id }).select("name");
    if (!turf) {
      return res.status(404).json({ success: false, message: "Turf not found for this owner." });
    }
    
    if (!targets || !Array.isArray(targets) || targets.length === 0) {
      return res.status(400).json({ success: false, message: "A list of targets is required." });
    }
    
    if (typeof discountAmount !== "string" || !discountAmount.trim() ||
        typeof offerDay !== "string" || !offerDay.trim() || !expiryDate) {
      return res.status(400).json({ success: false, message: "Discount, eligible day, and expiry date are required." });
    }
    if (Number.isNaN(Date.parse(expiryDate))) {
      return res.status(400).json({ success: false, message: "Enter a valid offer expiry date." });
    }

    const contentSid = process.env.TWILIO_CAMPAIGN_SID;
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN ||
        !(process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER) || !contentSid) {
      return res.status(500).json({ success: false, message: "Twilio credentials, WhatsApp sender, or TWILIO_CAMPAIGN_SID are not configured." });
    }

    let sentCount = 0;
    let failedCount = 0;
    const expiryLabel = new Date(`${expiryDate}T00:00:00.000Z`).toLocaleDateString("en-IN", {
      dateStyle: "long",
      timeZone: "UTC",
    });

    for (const target of targets) {
      if (!target.phone) continue;
      try {
        await sendWhatsAppTemplate({
          phoneNumber: target.phone,
          contentSid,
          templateName: "TWILIO_CAMPAIGN_SID",
          variables: {
            1: String(turf.name),
            2: String(target.name ? target.name.split(" ")[0] : "Customer"),
            3: String(discountAmount.trim()),
            4: String(offerDay.trim()),
            5: expiryLabel,
            6: String(link?.trim() || `https://gametrack.in/booking/${turfId}`),
          },
        });
        sentCount++;
      } catch (err) {
        console.error(`Failed to send WhatsApp to ${target.phone}:`, err.message);
        failedCount++;
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: `Campaign completed. Sent: ${sentCount}, Failed: ${failedCount}` 
    });

  } catch (error) {
    console.error("Error in sendWhatsAppCampaign:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
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
  getAvailableSlots,
  addManualBooking,
  cancelBooking,
  recordBookingPayment,
  getSubscriptions,
  generatePdf,
  updateSubscriptionSlot,
  addManualSubscription,
  sendWhatsAppCampaign

};

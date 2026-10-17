const User = require("../models/user-model");
const { sendOtp, verifyOtp } = require("./otp-controller");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Booking = require("../models/booking-model");
const turfModel = require("../models/turf-model");
const Owner = require("../models/owner-model");
const Notification = require('../models/notification-model');
const cron = require("node-cron");
const { sendMessage, OwnerUpdate, UserSubscriptionUpdate, OwnerSubscriptionUpdate } = require("../twilio/sendMessage");
const bookingModel = require("../models/booking-model");
const subscriptionModel = require('../models/subscription-model')
const Payment = require("../models/payment-model");
const { calculateBookingTotal, calculateAdvance } = require("../utils/booking-pricing");
const { getBookingInterval, getBookingEnd, isReviewEligible, isCancellationEligible } = require("../utils/booking-time");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

const userRegister = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }
  try {


    const { firstName, lastName, phone } = req.body;

    if (!firstName || !lastName || !phone) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, and phone number are required.",
      });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(409).json({
          success: false,
          message: "User already exists. Please login.",
        });
      } else {
        const otpResult = await sendOtp({ identifier: existingUser.phone, role: "user" });
        if (!otpResult.success) {
          return res.status(502).json({ success: false, message: otpResult.message });
        }
        return res.status(200).json({
          success: true,
          message: "OTP sent for verification",
        });
      }
    }

    const newUser = await User.create({
      fullname: `${firstName} ${lastName}`,
      phone,
      isVerified: false,
    });

    const otpResult = await sendOtp({ identifier: phone, role: "user" });
    if (!otpResult.success) {
      return res.status(502).json({ success: false, message: otpResult.message, userId: newUser._id });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent for verification",
      userId: newUser._id,
    });
  } catch (error) {
    console.error("User registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
      });
    }
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Phone or email is required",
      });
    }

    const owner = await Owner.findOne({
      email: identifier,
    });

    if (owner) {
      const result = await sendOtp({ identifier, role: "owner" });
      if (!result.success) {
        return res.status(502).json({ success: false, message: result.message });
      }
      return res.status(200).json({
        success: true,
        message: `OTP sent to owner account`,
      });
    }
    else {
      const result = await sendOtp({ identifier, role: "user" });
      if (!result.success) {
        return res.status(502).json({ success: false, message: result.message });
      }
      return res.status(200).json({
        success: true,
        message: `OTP sent to user account`,
      });
    }
    
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


const userLogout = async (req, res) => {
  try {

    res.clearCookie("authToken", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });


    res
      .status(200)
      .json({ success: true, message: " Logged out successfully" });
  } catch (error) {
    console.error("Error logging out user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


//create order for booking and subscription

const createOrder = async (req, res) => {
  let { amount, receipt, bookingDetails, subscriptionDetails } = req.body;
  const { data: authenticatedUser, role } = req.auth || {};
  if (role !== "user" || !authenticatedUser?._id) {
    return res.status(403).json({ success: false, message: "User account required" });
  }
  if (!bookingDetails && !subscriptionDetails) {
    return res.status(400).json({ success: false, message: "Booking details are required" });
  }

  if (bookingDetails) {
    const slot = bookingDetails.slots?.[0];
    if (!bookingDetails.turfId || !/^\d{4}-\d{2}-\d{2}$/.test(bookingDetails.date || "") ||
        !slot?.start || !slot?.end || !bookingDetails.sport) {
      return res.status(400).json({ success: false, message: "Invalid booking details" });
    }
    const turf = await turfModel.findById(bookingDetails.turfId);
    if (!turf || turf.isActive === false) {
      return res.status(404).json({ success: false, message: "Turf not found" });
    }
    const total = calculateBookingTotal({ ...turf.toObject(), start: slot.start, end: slot.end });
    if (total === null || total <= 0) {
      return res.status(400).json({ success: false, message: "Invalid booking time or price" });
    }
    const advance = calculateAdvance(total);
    if (!advance) {
      return res.status(400).json({ success: false, message: "Booking advance must be greater than zero" });
    }
    bookingDetails = {
      turfId: turf._id,
      userId: authenticatedUser._id,
      date: bookingDetails.date,
      slots: [slot],
      sport: bookingDetails.sport,
      duration: bookingDetails.duration,
      slotFees: total,
      amount: advance,
      paymentType: "advance",
    };
    const dateSlots = turf.bookedSlots?.find((entry) => entry.date === bookingDetails.date)?.slots || [];
    if (dateSlots.some((booked) => booked.start < slot.end && booked.end > slot.start)) {
      return res.status(409).json({ success: false, message: "This time slot is no longer available" });
    }
    amount = advance;
  } else {
    const { turfId, planId, fromDate, toDate, slot } = subscriptionDetails;
    if (!turfId || !planId || !/^\d{4}-\d{2}-\d{2}$/.test(fromDate || "") ||
        !/^\d{4}-\d{2}-\d{2}$/.test(toDate || "") || !slot?.start || !slot?.end || !subscriptionDetails.sport) {
      return res.status(400).json({ success: false, message: "Invalid subscription details" });
    }
    const turf = await turfModel.findById(turfId);
    if (!turf || turf.isActive === false) return res.status(404).json({ success: false, message: "Turf not found" });
    const plan = turf.subscription.id(planId);
    const durationDays = Number(plan?.days);
    const durationHours = Number(subscriptionDetails.duration);
    const startDate = new Date(`${fromDate}T00:00:00.000Z`);
    const endDate = new Date(`${toDate}T00:00:00.000Z`);
    const dayCount = Math.round((endDate - startDate) / 86400000) + 1;
    const startMinutes = Number(slot.start.slice(0, 2)) * 60 + Number(slot.start.slice(3, 5));
    const endMinutes = Number(slot.end.slice(0, 2)) * 60 + Number(slot.end.slice(3, 5));
    if (!plan || !Number.isInteger(durationDays) || durationDays !== dayCount ||
        ![7, 15, 30, 60, 90].includes(durationDays) || !Number.isFinite(durationHours) || durationHours <= 0 ||
        !/^\d{2}:\d{2}$/.test(slot.start) || !/^\d{2}:\d{2}$/.test(slot.end) ||
        startMinutes >= 1440 || endMinutes >= 1440 || (endMinutes <= startMinutes && endMinutes + 1440 - startMinutes !== durationHours * 60)) {
      return res.status(400).json({ success: false, message: "Invalid subscription plan, dates, or time" });
    }
    const totalAmount = Math.round(durationHours * Number(plan.amount) * 100) / 100;
    const advanceAmount = Math.round(totalAmount * 0.2);
    const platformFee = Math.round(advanceAmount * 0.0218);
    if (!(totalAmount > 0) || !(advanceAmount > 0)) return res.status(400).json({ success: false, message: "Invalid subscription price" });
    subscriptionDetails = {
      turfId: turf._id, planId: plan._id, userId: authenticatedUser._id,
      fromDate, toDate, durationDays, slot: { start: slot.start, end: slot.end },
      duration: durationHours.toFixed(1), sport: subscriptionDetails.sport,
      totalAmount, advanceAmount, platformFee, paymentType: "advance",
    };
    amount = advanceAmount + platformFee;
  }

  console.log("Create order called for authenticated user and turf:", authenticatedUser._id, bookingDetails?.turfId || subscriptionDetails?.turfId);
  let options = {
    amount: Math.round(Number(amount) * 100),
    currency: "INR",
    receipt: String(receipt || `booking_${Date.now()}`).slice(0, 40),
  };

  const user = authenticatedUser;
  // user.firstBooking == true;
  // console.log("user first booking", user.firstBooking)
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "User not found, Login First",
    });
  }
  // if(user.firstBooking && bookingDetails){

  //     bookingDetails.finalPrice = bookingDetails.slotFees -50
  //     bookingDetails.originalPrice = bookingDetails.slotFees
  //     options.amount = bookingDetails.finalPrice * 100


  // }
  try {
    if (subscriptionDetails) {
      const { turfId, userId, fromDate, toDate, slot } = subscriptionDetails;
      const requestedStart = Number(slot.start.slice(0, 2)) * 60 + Number(slot.start.slice(3, 5));
      const requestedEndRaw = Number(slot.end.slice(0, 2)) * 60 + Number(slot.end.slice(3, 5));
      const requestedEnd = requestedEndRaw <= requestedStart ? requestedEndRaw + 1440 : requestedEndRaw;
      const turf = await turfModel.findById(turfId);
      const existingUserBooking = await subscriptionModel.findOne({
        turfId, userId, startDate: { $lte: new Date(`${toDate}T23:59:59.999Z`) },
        endDate: { $gte: new Date(`${fromDate}T00:00:00.000Z`) }, status: { $ne: "cancelled" },
        "slot.start": slot.start,
      });
      const subscriptionConflict = turf?.subscriptionSlots?.some((entry) => {
        const inDateRange = entry.fromDate <= toDate && entry.toDate >= fromDate;
        const occupiedStart = Number(entry.slot.start.slice(0, 2)) * 60 + Number(entry.slot.start.slice(3, 5));
        const occupiedEndRaw = Number(entry.slot.end.slice(0, 2)) * 60 + Number(entry.slot.end.slice(3, 5));
        const occupiedEnd = occupiedEndRaw <= occupiedStart ? occupiedEndRaw + 1440 : occupiedEndRaw;
        return inDateRange && requestedStart < occupiedEnd && requestedEnd > occupiedStart;
      });
      const ordinaryConflict = turf?.bookedSlots?.some((day) => day.date >= fromDate && day.date <= toDate &&
        day.slots?.some((occupied) => {
          const occupiedStart = Number(occupied.start.slice(0, 2)) * 60 + Number(occupied.start.slice(3, 5));
          const occupiedEndRaw = Number(occupied.end.slice(0, 2)) * 60 + Number(occupied.end.slice(3, 5));
          const occupiedEnd = occupiedEndRaw <= occupiedStart ? occupiedEndRaw + 1440 : occupiedEndRaw;
          return requestedStart < occupiedEnd && requestedEnd > occupiedStart;
        }));
      if (existingUserBooking || subscriptionConflict || ordinaryConflict) {
        return res.status(409).json({ success: false, message: "One or more slots are already booked" });
      }

      const pendingPayment = await Payment.findOne({
        userId: subscriptionDetails.userId,
        status: { $in: ['created', 'attempted'] },
        "subscription.turfId": subscriptionDetails.turfId,
        "subscription.fromDate": subscriptionDetails.fromDate,
        "subscription.toDate": subscriptionDetails.toDate,
        "subscription.slot.start": subscriptionDetails.slot.start
      });

      if (pendingPayment) {
        return res.json({
          order: { id: pendingPayment.orderId, amount: pendingPayment.amount }
        });
      }
      const order = await razorpay.orders.create(options);

      await Payment.create({
        userId: subscriptionDetails.userId,
        orderId: order.id,
        amount: options.amount,
        status: "created",
        subscription: subscriptionDetails
      });

      return res.json({ order });

    } else {
      const { turfId, userId, date, slots } = bookingDetails;
      const requestedSlot = slots[0];
      const overlappingBooking = await Booking.findOne({
        turfId,
        date,
        slots: {
          $elemMatch: { start: { $lt: requestedSlot.end }, end: { $gt: requestedSlot.start } },
        },
        status: { $ne: "cancelled" },
      });

      if (overlappingBooking) {
        return res.status(409).json({
          success: false,
          message: "One or more slots are already booked",
        });
      }

      const activeSince = new Date(Date.now() - 15 * 60 * 1000);
      const pendingQuery = {
        status: { $in: ['created', 'attempted'] },
        createdAt: { $gte: activeSince },
        "booking.turfId": turfId,
        "booking.date": date,
        "booking.slots": { $elemMatch: { start: { $lt: requestedSlot.end }, end: { $gt: requestedSlot.start } } }
      };
      const pendingPayment = await Payment.findOne({ ...pendingQuery, userId });

      if (pendingPayment) {
        return res.json({
          order: { id: pendingPayment.orderId, amount: pendingPayment.amount }
        });
      }
      const anotherCustomerPayment = await Payment.exists(pendingQuery);
      if (anotherCustomerPayment) {
        return res.status(409).json({ success: false, message: "This slot has a payment in progress" });
      }

      const order = await razorpay.orders.create(options);

      await Payment.create({
        userId: bookingDetails.userId,
        orderId: order.id,
        amount: options.amount,
        status: "created",
        booking: bookingDetails
      });
      res.json({ order });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Order creation failed" });
  }
};
const updateSubscriptionSlots = async (turfId, subscriptionDetails) => {
  try {
    const turf = await turfModel.findById(turfId);
    if (!turf) {
      throw new Error('Turf not found');
    }
    const newSubscriptionSlot = {
      user: subscriptionDetails.userId,
      fromDate: subscriptionDetails.fromDate,
      toDate: subscriptionDetails.toDate,
      slot: {
        start: subscriptionDetails.slot.start,
        end: subscriptionDetails.slot.end
      }
    };

    turf.subscriptionSlots.push(newSubscriptionSlot);

    // Save the updated turf document
    const updatedTurf = await turf.save();

    return updatedTurf;
  } catch (error) {
    console.error('Error updating subscription slots:', error);
    throw error;
  }
};
const updateTurfBookedSlots = async (turfId, bookingDetails) => {
  const slot = bookingDetails.slots[0];
  const overlaps = { start: { $lt: slot.end }, end: { $gt: slot.start } };
  const existingDateUpdate = await turfModel.updateOne(
    {
      _id: turfId,
      bookedSlots: { $elemMatch: { date: bookingDetails.date, slots: { $not: { $elemMatch: overlaps } } } },
    },
    { $push: { "bookedSlots.$.slots": slot } }
  );
  if (existingDateUpdate.modifiedCount === 1) return true;

  const newDateUpdate = await turfModel.updateOne(
    { _id: turfId, bookedSlots: { $not: { $elemMatch: { date: bookingDetails.date } } } },
    { $push: { bookedSlots: { date: bookingDetails.date, slots: [slot] } } }
  );
  return newDateUpdate.modifiedCount === 1;
};

const confirmBookingWithoutAdvance = async (req, res) => {
  try {
    const { data: user, role } = req.auth;
    if (role !== "user") {
      return res.status(403).json({ success: false, message: "User account required" });
    }
    const { bookingDetails } = req.body;
    const { turfId, date, slots, sport } = bookingDetails || {};
    const slot = slots?.[0];
    if (!turfId || !date || !slot?.start || !slot?.end || !sport) {
      return res.status(400).json({ success: false, message: "Invalid booking details" });
    }

    const turf = await turfModel.findById(turfId).populate("owner", "turfname phone");
    if (!turf) return res.status(404).json({ success: false, message: "Turf not found" });

    const slotFees = calculateBookingTotal({ ...turf.toObject(), start: slot.start, end: slot.end });
    if (slotFees === null || slotFees <= 0) {
      return res.status(400).json({ success: false, message: "Invalid booking time or price" });
    }

    const existingDate = turf.bookedSlots?.find((entry) => entry.date === date);
    const overlaps = (existing) => existing.start < slot.end && existing.end > slot.start;
    if (existingDate?.slots?.some(overlaps)) {
      return res.status(409).json({ success: false, message: "This time slot is no longer available" });
    }

    const booking = await Booking.create({
      turfId,
      userId: user._id,
      fullname: user.fullname || "Guest",
      phone: user.phone,
      date,
      slots: [slot],
      sport,
      slotFees: Number(slotFees),
      amountPaid: 0,
      paymentType: "Manual",
      status: "confirmed",
    });
    const reserved = await updateTurfBookedSlots(turfId, { date, slots: [slot] });
    if (!reserved) {
      await Booking.deleteOne({ _id: booking._id });
      return res.status(409).json({ success: false, message: "This time slot is no longer available" });
    }

    const slotTimeText = `${slot.start} - ${slot.end}`;
    // The no-advance path confirms the booking without calling the payment
    // verification handler, so send the customer template from this path too.
    await sendMessage({
      phoneNumber: user.phone,
      notification_data: {
        customerName: user.fullname || "Guest",
        turfName: turf.owner?.turfname || turf.name || "GameTrack turf",
        date: new Date(`${date}T00:00:00.000Z`).toLocaleDateString("en-IN", {
          dateStyle: "long",
          timeZone: "UTC",
        }),
        startTime: slot.start,
        endTime: slot.end,
        bookingReference: String(booking._id).slice(-8).toUpperCase(),
        totalAmount: slotFees,
        advancePaid: 0,
        remainingAmount: slotFees,
        contactPhone: turf.owner?.phone,
        website: "https://gametrack.in",
      },
    });

    try {
      await Promise.all([
        Notification.create({
          user: user._id,
          owner: turf.owner?._id,
          title: "Booking Confirmed",
          message: `Your booking on ${date} at ${slotTimeText} is confirmed at ${turf.owner?.turfname || turf.name}`,
          type: "booking",
          role: "user",
          date: new Date(),
        }),
        Notification.create({
          user: user._id,
          owner: turf.owner?._id,
          title: "New Booking Alert",
          message: `New booking on ${date} at ${slotTimeText} at ${turf.owner?.turfname || turf.name}`,
          type: "booking",
          role: "owner",
          date: new Date(),
        }),
      ]);
    } catch (notificationError) {
      console.error("Booking confirmed, but notification creation failed:", notificationError.message);
    }

    return res.status(201).json({ success: true, booking });
  } catch (error) {
    console.error("Booking without advance failed:", error);
    return res.status(500).json({ success: false, message: "Could not confirm booking" });
  }
};


const verifyOrder = async (req, res) => {
  let reservedBookingSlot = null;
  let reservedSubscriptionSlot = null;
  let bookingPersisted = false;
  try {
    const { data: user, role } = req.auth;
    if (role !== "user") return res.status(403).json({ success: false, message: "User account required" });
    let {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingDetails,
      subscriptionDetails
    } = req.body;

    let details = subscriptionDetails ? subscriptionDetails : bookingDetails;
    const userId = user._id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification details are incomplete" });
    }

    const alreadyProcessed = await Booking.findOne({ userId, razorpay_order_id }) ||
      await subscriptionModel.findOne({ userId, razorpay_order_id });

    if (alreadyProcessed) {
      await Payment.updateOne(
        { orderId: razorpay_order_id, userId },
        { $set: { status: "paid" } }
      );
      return res.status(200).json({
        success: true,
        message: "Payment already processed",
        booking: alreadyProcessed
      });
    }
    const paymentExists = await Payment.findOne({
      orderId: razorpay_order_id,
      userId,
      status: { $in: ["created", "attempted", "processing"] }
    });

    if (!paymentExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired payment order"
      });
    }

    if (paymentExists.booking?.turfId) {
      bookingDetails = paymentExists.booking.toObject?.() || paymentExists.booking;
      subscriptionDetails = null;
      details = bookingDetails;
    } else if (paymentExists.subscription?.turfId) {
      subscriptionDetails = paymentExists.subscription.toObject?.() || paymentExists.subscription;
      bookingDetails = null;
      details = subscriptionDetails;
    } else {
      return res.status(400).json({ success: false, message: "Booking data is missing from this payment order" });
    }

    const userData = user;
    const turf = await turfModel.findById(details.turfId).populate("owner", "turfname phone");
    if (!turf) return res.status(404).json({ success: false, message: "Turf not found" });
    const turfName = turf?.owner?.turfname || turf.name || "your turf";

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSignature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment signature" });
    }

    const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);
    if (razorpayPayment.order_id !== razorpay_order_id ||
        razorpayPayment.status !== "captured" ||
        Number(razorpayPayment.amount) !== Number(paymentExists.amount)) {
      return res.status(400).json({ success: false, message: "Payment amount or status could not be verified" });
    }

    const staleProcessingBefore = new Date(Date.now() - 2 * 60 * 1000);
    const claim = await Payment.updateOne(
      {
        orderId: razorpay_order_id,
        userId,
        $or: [
          { status: { $in: ["created", "attempted"] } },
          { status: "processing", updatedAt: { $lt: staleProcessingBefore } },
        ],
      },
      { $set: { status: "processing", updatedAt: new Date() } }
    );
    if (claim.modifiedCount !== 1) {
      return res.status(409).json({ success: false, message: "Payment confirmation is already being processed. Please refresh your bookings shortly." });
    }

    if (!subscriptionDetails) {
      const reserved = await updateTurfBookedSlots(details.turfId, details);
      if (!reserved) {
        await razorpay.payments.refund(razorpay_payment_id, { amount: Number(paymentExists.amount) });
        await Payment.updateOne({ orderId: razorpay_order_id }, { $set: { status: "failed" } });
        return res.status(409).json({ success: false, message: "The slot was taken during payment. The payment has been refunded." });
      }
      reservedBookingSlot = { turfId: details.turfId, date: details.date, slot: details.slots[0] };
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Missing user ID for booking",
      });
    }
    let newBooking;
    if (subscriptionDetails) {
      await updateSubscriptionSlots(subscriptionDetails.turfId, subscriptionDetails)
      reservedSubscriptionSlot = {
        turfId: subscriptionDetails.turfId,
        userId,
        fromDate: subscriptionDetails.fromDate,
        toDate: subscriptionDetails.toDate,
        slot: subscriptionDetails.slot,
      };
      newBooking = await subscriptionModel.create({
        turfId: subscriptionDetails.turfId,
        userId,
        startDate: subscriptionDetails.fromDate,
        endDate: subscriptionDetails.toDate,
        slot: subscriptionDetails.slot,
        sport: subscriptionDetails.sport,
        durationDays: subscriptionDetails.durationDays,
        daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        amountPaid: subscriptionDetails.advanceAmount,
        totalAmount: subscriptionDetails.totalAmount,
        razorpay_payment_id,
        razorpay_order_id,
        paymentType: subscriptionDetails.paymentType,
        status: "confirmed",
        reminderSent: false,
      });
    } else {

      newBooking = await Booking.create({
        turfId: bookingDetails.turfId,
        userId,
        date: bookingDetails.date,
        slots: bookingDetails.slots,
        sport: bookingDetails.sport,
        slotFees: bookingDetails.slotFees,
        originalPrice: bookingDetails.originalPrice,
        finalPrice: bookingDetails.finalPrice,
        amountPaid: bookingDetails.amount,
        paymentHistory: bookingDetails.amount > 0 ? [{
          amount: bookingDetails.amount,
          method: "online",
          receivedAt: new Date(),
          reference: razorpay_payment_id,
        }] : [],
        razorpay_payment_id,
        razorpay_order_id,
        paymentType: bookingDetails.paymentType,
        status: "confirmed",
        reminderSent: false,
      });
    }
    bookingPersisted = true;

    // Persist the booking before marking the captured payment complete. This keeps
    // a database write failure retryable and avoids reporting a paid booking that
    // was never stored.
    await Payment.updateOne(
      { orderId: razorpay_order_id, userId },
      { $set: { status: "paid" } }
    );

    if (user.firstBooking && bookingDetails) {
      user.firstBooking = false;
      await user.save();
    }

    try {
    if (!subscriptionDetails) {

      const slotTimeText = `${bookingDetails.slots[0].start} - ${bookingDetails.slots[0].end}`;




      await sendMessage({
        phoneNumber: userData.phone,
        notification_data: {
          name: (userData.fullname || "Guest").split(" ")[0],
          bookingReference: String(newBooking._id).slice(-8).toUpperCase(),
          turfName: turfName,
          date: new Date(bookingDetails.date).toDateString(),
          time: slotTimeText,
          location: turf.location?.city || "Not provided",
          amount: bookingDetails.slotFees,
          sport: bookingDetails.sport,
          advance: bookingDetails.amount,
          remaining: bookingDetails.slotFees - bookingDetails.amount
        }
      });

      await OwnerUpdate({
        phoneNumber: turf.owner.phone,
        notification_data: {
          user: userData.fullname,
          phone: userData.phone,
          bookingReference: String(newBooking._id).slice(-8).toUpperCase(),
          date: new Date(bookingDetails.date).toDateString(),
          slotStart: bookingDetails.slots[0].start,
          slotEnd: bookingDetails.slots[0].end,
          duration: bookingDetails.duration,
          sport: bookingDetails.sport,
          total: bookingDetails.slotFees,
          advance: bookingDetails.amount,
          remained:
            bookingDetails.status === "cancelled"
              ? 0
              : bookingDetails.slotFees - bookingDetails.amount

        }
      });

      await Promise.all([
        Notification.create({
          user: userId,
          owner: turf.owner._id,
          title: "Booking Confirmed",
          message: `Your booking on ${bookingDetails.date} at ${slotTimeText} is confirmed at ${turfName}`,
          type: "booking",
          role: "user",
          date: new Date(),
        }),
        Notification.create({
          user: userId,
          owner: turf.owner._id,
          title: "New Booking Alert",
          message: `New booking on ${bookingDetails.date} at ${slotTimeText} at ${turfName}`,
          type: "booking",
          role: "owner",
          date: new Date(),
        }),
      ]);
    } else if (subscriptionDetails) {

      await UserSubscriptionUpdate({
        phoneNumber: userData.phone,
        notification_data: {
          name: userData.fullname,
          turfName: turf.name,
          fromDate: new Date(subscriptionDetails.fromDate).toDateString(),
          toDate: new Date(subscriptionDetails.toDate).toDateString(),
          totalDays: subscriptionDetails.durationDays,
          slotStart: subscriptionDetails.slot.start,
          slotEnd: subscriptionDetails.slot.end,
          duration: subscriptionDetails.slot.duration,
          sport: subscriptionDetails.sport,
          total: subscriptionDetails.totalAmount,
          advance: subscriptionDetails.advanceAmount,
          remaining: subscriptionDetails.totalAmount - subscriptionDetails.advanceAmount
        }
      });

      await OwnerSubscriptionUpdate({
        phoneNumber: turf.owner.phone,
        notification_data: {
          user: userData.fullname,
          userPhone: userData.phone,
          fromDate: new Date(subscriptionDetails.fromDate).toDateString(),
          toDate: new Date(subscriptionDetails.toDate).toDateString(),
          totalDays: subscriptionDetails.durationDays,
          slotStart: subscriptionDetails.slot.start,
          slotEnd: subscriptionDetails.slot.end,
          duration: subscriptionDetails.slot.duration,
          total: subscriptionDetails.totalAmount,
          advance: subscriptionDetails.advanceAmount,
          remaining: subscriptionDetails.totalAmount - subscriptionDetails.advanceAmount
        }
      });


    }
    } catch (notificationError) {
      console.error("Booking saved, but confirmation notification failed:", notificationError.message);
    }
    return res.status(200).json({
      success: true,
      message: "Payment verified and booking confirmed",
      booking: newBooking,
    });

  } catch (err) {
    console.error(" Payment verification error:", err);
    if (!bookingPersisted && reservedBookingSlot) {
      const { turfId, date, slot } = reservedBookingSlot;
      await turfModel.updateOne(
        { _id: turfId },
        { $pull: { "bookedSlots.$[day].slots": slot } },
        { arrayFilters: [{ "day.date": date }] }
      ).catch((cleanupError) => console.error("Could not release failed booking reservation:", cleanupError.message));
    }
    if (!bookingPersisted && reservedSubscriptionSlot) {
      const { turfId, userId, fromDate, toDate, slot } = reservedSubscriptionSlot;
      await turfModel.updateOne(
        { _id: turfId },
        { $pull: { subscriptionSlots: { user: userId, fromDate, toDate, "slot.start": slot.start, "slot.end": slot.end } } }
      ).catch((cleanupError) => console.error("Could not release failed subscription reservation:", cleanupError.message));
    }
    if (!bookingPersisted && req.body?.razorpay_order_id) {
      await Payment.updateOne(
        { orderId: req.body.razorpay_order_id, userId: req.auth?.data?._id, status: "processing" },
        { $set: { status: "attempted" } }
      ).catch((cleanupError) => console.error("Could not reset payment for retry:", cleanupError.message));
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};




const getAllBookings = async (req, res) => {
  try {
    const { data: user, role } = req.auth;
    const userId = user._id;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "Unauthorised, Login First" });
    }
    const allBookings = await Booking.find({ userId: userId }).populate("turfId", "name");
    res.status(200).json({ success: true, allBookings: allBookings });
  } catch (error) {
    console.error("Error fetching bookings:", error.message);
    return res.status(500).json({
      success: false,
      message: "Fetch Bookings Error",
    });
  }
};

const getBookingConfirmation = async (req, res) => {
  try {
    const { data: user, role } = req.auth || {};
    if (role !== "user") return res.status(403).json({ success: false, message: "User account required" });
    const booking = await Booking.findOne({ _id: req.params.bookingId, userId: user._id })
      .populate("turfId", "name location");
    if (booking) return res.json({ success: true, booking, kind: "booking" });
    const subscription = await subscriptionModel.findOne({ _id: req.params.bookingId, userId: user._id })
      .populate("turfId", "name location");
    if (!subscription) return res.status(404).json({ success: false, message: "Booking not found" });
    return res.json({ success: true, subscription, kind: "subscription" });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Invalid booking reference" });
  }
};

const cancelCustomerBooking = async (req, res) => {
  try {
    const { data: user, role } = req.auth || {};
    if (role !== "user") return res.status(403).json({ success: false, message: "User account required" });
    const booking = await Booking.findOne({ _id: req.params.bookingId, userId: user._id });
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    if (booking.status !== "confirmed") return res.status(409).json({ success: false, message: "Only confirmed bookings can be cancelled" });

    const firstSlot = booking.slots?.[0];
    const interval = getBookingInterval(booking.date, firstSlot);
    if (!interval || !booking.createdAt) {
      return res.status(400).json({ success: false, message: "Booking date or time is invalid" });
    }
    if (!isCancellationEligible({ createdAt: booking.createdAt, date: booking.date, slot: firstSlot })) {
      return res.status(409).json({ success: false, message: "Cancellation is available only within 24 hours of booking and more than 24 hours before the slot" });
    }
    if (Number(booking.amountPaid || 0) > 0 || booking.razorpay_payment_id) {
      return res.status(409).json({ success: false, message: "This booking has a payment. Please contact the turf to arrange cancellation and any refund." });
    }

    const turf = await turfModel.findById(booking.turfId);
    if (!turf) return res.status(404).json({ success: false, message: "Turf not found" });
    const dateKey = booking.date.toISOString().slice(0, 10);
    const day = turf.bookedSlots.find((entry) => entry.date === dateKey);
    if (!day) return res.status(409).json({ success: false, message: "This slot is no longer listed as booked" });
    const bookingSlots = booking.slots || [];
    const cancellation = await Booking.updateOne(
      { _id: booking._id, userId: user._id, status: "confirmed", amountPaid: { $in: [null, 0] }, $or: [{ razorpay_payment_id: { $exists: false } }, { razorpay_payment_id: null }] },
      { $set: { status: "cancelled" } }
    );
    if (cancellation.modifiedCount !== 1) return res.status(409).json({ success: false, message: "This booking can no longer be cancelled" });

    const removed = await turfModel.updateOne(
      { _id: turf._id, bookedSlots: { $elemMatch: { date: dateKey, slots: { $elemMatch: { $or: bookingSlots.map(({ start, end }) => ({ start, end })) } } } } },
      { $pull: { "bookedSlots.$.slots": { $or: bookingSlots.map(({ start, end }) => ({ start, end })) } } }
    );
    if (removed.modifiedCount !== 1) {
      await Booking.updateOne({ _id: booking._id, status: "cancelled" }, { $set: { status: "confirmed" } });
      return res.status(409).json({ success: false, message: "Could not release the booked slot. Please try again." });
    }
    const cancelledBooking = await Booking.findById(booking._id).populate("turfId", "name");
    return res.json({ success: true, booking: cancelledBooking, message: "Booking cancelled" });
  } catch (error) {
    console.error("Customer cancellation failed:", error.message);
    return res.status(500).json({ success: false, message: "Could not cancel this booking" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId, email, isNotification, preferredTime } = req.body;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "Unauthorised, Login First" });
    }

    const updateFields = {};
    if (email) updateFields.email = email;
    if (typeof isNotification !== "undefined")
      updateFields.isNotification = isNotification;
    if (preferredTime) updateFields.preferredTime = preferredTime;

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
    });

    console.log("Updated User:", updatedUser);
    res.status(200).json({
      success: true,
      updatedUser,
      message: "User Updated Successfully",
    });
  } catch (err) {
    console.log("Error to Update User", err);
    res.status(200).json({
      success: false,
      message: "Can not Update User",
      error: err.message,
    });
  }
};

cron.schedule("*/5 * * * *", async () => {
  const now = new Date();
  const bookings = await Booking.find({}).populate("userId");

  for (let booking of bookings) {
    const bookingDate = new Date(booking.date);
    const slotTime = booking.slots[0]?.start;

    const slotDateTime = new Date(`${booking.date} ${slotTime}`);
    const diffInMs = slotDateTime.getTime() - now.getTime();
    const diffInMinutes = diffInMs / (1000 * 60);

    if (diffInMinutes > 59 && diffInMinutes < 61 && !booking.reminderSent) {
      await Notification.create({
        user: booking.userId._id,
        role: "user",
        title: "Booking Reminder",
        owner: booking.turfId.owner,
        message: " Your booking is in 1 hour",
        type: "reminder"
      });

      if (diffInMinutes > 10 && diffInMinutes < 12 && !booking.reminderSent) {
        await Notification.create({
          user: booking.userId._id,
          role: "owner",
          title: "Booking Reminder",
          owner: booking.turfId.owner,
          message: "New booking is in 10 minutes",
          type: "reminder"
        });
      }

      booking.reminderSent = true;
      await booking.save();
    }
  }
});

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Allready Have not any Account, Login First",
      });
    }
    await User.findByIdAndDelete(userId);

    res
      .status(200)
      .json({ success: true, message: "User Deleted Successfully" });
  } catch (err) {
    console.log("Error to Delete User", err);
    res.status(200).json({
      success: false,
      message: "Can not Delete User",
      error: err.message,
    });
  }
};

const addFavorite = async (req, res) => {
  try {
    const { userId, turfId } = req.body;

    if (!userId || !turfId) {
      return res
        .status(400)
        .json({ message: "User ID and Turf ID are required." });
    }

    const user = await User.findById(userId);

    const turf = await turfModel.findById(turfId);
    if (!user || !turf) {
      return res.status(404).json({ message: "User or Turf not found." });
    }

    if (user.favoriteTurfs.includes(turfId)) {
      return res
        .status(409)
        .json({ message: "Turf is already in favoriteTurfs." });
    }

    user.favoriteTurfs.push(turfId);
    await user.save();

    return res.status(200).json({
      message: "Turf added to favoriteTurfs successfully.",
      favoriteTurfs: user.favoriteTurfs,
    });
  } catch (error) {
    console.error("Add favorite error:", error);
    res.status(500).json({ message: "Server error. Couldn't add favorite." });
  }
};

const getBookedSlots = async () => {
  try {
    const { turfId, date } = req.query
    if (!turfId) {
      res.status(400).json({ message: "turfId not found" })
    }
    const turf = await turfModel.findById(turfId);
    if (!turf) {
      res.status(400).json({ message: "Turf not found" })

    }
    const bookedDay = turf.bookedSlots.find((s) => s.date === date)
    const bookedslots = bookedDay.slots
    res.status(200).json({ bookedSlots: bookedslots })
  } catch (error) {
    console.log("unable to fetch the booked slots", error)
    res.status(500).json({ message: "Unable to fetch Booked Slots" })
  }
}

const getFavoriteTurfs = async (req, res) => {
  try {
    const { data: user, role } = req.auth;
    const customer = await User.findById(user._id).populate(
      "favoriteTurfs",
      "_id name location avarageRating images dayPrice nightPrice"
    );
    if (!customer) {
      return res
        .status(401)
        .json({ message: "Unauthorized, login to Proceed" });
    }

    res.status(200).json({
      success: true,
      message: "Favorite Turfs fetched successfully",
      favoriteTurfs: customer.favoriteTurfs,
    });
  } catch (error) {
    console.log("Can't fetch favorite Turfs", error);
    res.status(500).json({
      success: false,
      message: "Can't fetch favorite Turfs",
      error: error,
    });
  }
};

const removeFavoriteTurf = async (req, res) => {
  try {
    const { turfId } = req.body;
    const { data: user, role } = req.auth;

    if (!turfId) {
      return res.status(400).json({ message: "Turf ID is required." });
    }

    const customer = await User.findById(user._id);
    if (!customer) {
      return res.status(404).json({ message: "User not found." });
    }
    console.log("turfId", turfId);
    const turfIndex = customer.favoriteTurfs.indexOf(turfId);
    console.log("turfIndex", turfIndex);
    if (turfIndex === -1) {
      return res.status(404).json({ message: "Turf not found in favorites." });
    }
    customer.favoriteTurfs.splice(turfIndex, 1);
    await customer.save();
    res.status(200).json({
      success: true,
      message: "Turf removed from favorites successfully.",
      favoriteTurfs: customer.favoriteTurfs,
    });
  } catch (error) {
    console.error("Error removing favorite turf:", error);
    res
      .status(500)
      .json({ message: "Server error. Couldn't remove favorite turf." });
  }
};

const getAllNotifications = async (req, res) => {

  try {
    let notifications = [];
    const { data, role } = req.auth
    if (role === "user") {
      const { data: user } = req.auth;
      notifications = await Notification.find({ user: user._id, role: "user" })
        .sort({ createdAt: -1 })
        .limit(20);
    } else if (role === "owner") {
      const { data: owner } = req.auth;
      notifications = await Notification.find({ owner: owner._id, role: "owner" })
        .sort({ createdAt: -1 })
        .limit(20);

    }

    return res.status(200).json({
      success: true,
      notifications: notifications || [],
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",

    });
  }
};


const getPendingReviews = async (req, res) => {
  try {
    const { data: user, role } = req.auth || {};
    if (role !== "user") return res.status(403).json({ success: false, message: "User account required" });
    const bookings = await bookingModel.find({ userId: user._id, status: "confirmed", isReviewed: { $ne: true } })
      .populate("turfId", "name")
      .sort({ date: -1 });
    const pendingReviews = bookings.filter((booking) => booking.turfId && isReviewEligible(booking))
      .map((booking) => {
        const end = getBookingEnd(booking);
        return {
          turfId: booking.turfId._id,
          turfName: booking.turfId.name,
          bookingId: booking._id,
          bookingDate: booking.date,
          endTime: end,
        };
      });
    return res.status(200).json({ success: true, pendingReviews });
  } catch (error) {
    console.error("Error in getPendingReviews:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


const submitReview = async (req, res) => {
  try {
    const { data: user, role } = req.auth || {};
    const { bookingId, turfId, rating, comment } = req.body || {};
    if (role !== "user") return res.status(403).json({ success: false, message: "User account required" });
    const numericRating = Number(rating);
    const reviewComment = typeof comment === "string" ? comment.trim() : "";
    if (!bookingId || !turfId) return res.status(400).json({ success: false, message: "Booking and turf are required" });
    if (!/^[a-f\d]{24}$/i.test(String(bookingId)) || !/^[a-f\d]{24}$/i.test(String(turfId))) {
      return res.status(400).json({ success: false, message: "Booking or turf reference is invalid" });
    }
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: "Choose a rating from 1 to 5 stars" });
    }
    if (reviewComment.length > 1000) return res.status(400).json({ success: false, message: "Review must be 1,000 characters or less" });

    const userBooking = await bookingModel.findOne({ _id: bookingId, userId: user._id, turfId, status: "confirmed" });
    if (!userBooking) {
      return res.status(404).json({ success: false, message: "Completed booking not found" });
    }
    if (!isReviewEligible(userBooking)) {
      return res.status(userBooking.isReviewed ? 409 : 400).json({ success: false, message: userBooking.isReviewed ? "You already reviewed this booking" : "You can review this booking after its last slot ends" });
    }

    const review = {
      user: user._id,
      booking: userBooking._id,
      verifiedBooking: true,
      name: user.fullname?.split(" ")[0] || "Player",
      rating: numericRating,
      comment: reviewComment,
    };
    const updatedTurf = await turfModel.findOneAndUpdate(
      { _id: turfId, "reviews.booking": { $ne: userBooking._id } },
      { $push: { reviews: review } },
      { new: true, runValidators: true }
    );
    if (!updatedTurf) {
      const turfExists = await turfModel.exists({ _id: turfId });
      return res.status(turfExists ? 409 : 404).json({ success: false, message: turfExists ? "You already reviewed this booking" : "Turf not found" });
    }

    await bookingModel.updateOne({ _id: userBooking._id, userId: user._id }, { $set: { isReviewed: true } });
    await turfModel.updateOne({ _id: turfId }, [{ $set: { averageRating: { $round: [{ $avg: "$reviews.rating" }, 1] } } }]);
    return res.status(201).json({ success: true, message: "Thanks for sharing your experience" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Something went wrong while submitting your review" });
  }
};

const getSubscriptionSlots = async (req, res) => {
  try {
    const { turfId } = req.query
    const { data: user, role } = req.auth;
    const turf = await turfModel.findById(turfId)
    if (!turf) {
      return res.status(400).json({ message: "Turf Not Found !" })
    }
    const subcription = turf.subscriptionSlots.find(s => s.user === user._id)
    if (!subcription) {
      return res.status(400).json({ message: "Subcription not Found" })
    }
    res.status(200).json(subcription)
  }
  catch {
    res.status(500).json({ message: "Can't get Subcrption" })
    console.log("unable get subscription", error)
  }
}

const completeProfile = async (req, res) => {
  try{
    const {firstName, lastName} = req.body;
    const { data: user, role } = req.auth;
    if(role !== "user"){
      return res.status(403).json({
        success: false,
        message: "Only users can complete profile",
      });
    }
    user.fullname = `${firstName} ${lastName}`;
    await user.save();
    return res.status(200).json({
      success: true,
      message: "Profile completed successfully",
      user,
    });
  }
  catch(err){
    console.error("Complete Profile Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

const userSubscription = async (req, res) => {
  try {
    const { data: user, role } = req.auth;
    const subscriptions = await subscriptionModel.find({ userId: user._id }).populate("turfId", "name");
    res.status(200).json({ success: true, subscriptions });
  }
  catch (error) {
    console.log("Error to Fetch Subscriptions", error);
    return res.status(500).json({
      success: false,
      message: "Fetch Subscriptions Error",
    });
  }
};



module.exports = {
  userRegister,
  userLogout,
  createOrder,
  confirmBookingWithoutAdvance,
  verifyOrder,
  getAllBookings,
  getBookingConfirmation,
  cancelCustomerBooking,
  updateUser,
  deleteUser,
  addFavorite,
  getFavoriteTurfs,
  login,
  getAllNotifications,
  removeFavoriteTurf,
  getBookedSlots,
  getPendingReviews,
  submitReview,
  completeProfile,
  getSubscriptionSlots,
  userSubscription

};


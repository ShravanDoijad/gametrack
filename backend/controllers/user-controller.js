const User = require("../models/user-model");
const { sendOtp, verifyOtp } = require("./otp-controller");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Booking = require("../models/booking-model");
const turfModel = require("../models/turf-model");
const Owner = require("../models/owner-model");
const admin = require("../firebase/firebase-admin");
const Notification = require('../models/notification-model');
const cron = require("node-cron");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

const userRegister = async (req, res) => {
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
        console.log("existing user", existingUser.phone);
        await sendOtp({ identifier: existingUser.phone, role: "user" });
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

    await sendOtp({ identifier: phone, role: "user" });

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
      return res.status(200).json({
        success: true,
        message: `OTP sent to owner account`,
      });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    });

    if (user) {
      const result = await sendOtp({ identifier, role: "user" });
      return res.status(200).json({
        success: true,
        message: `OTP sent to user account`,
      });
    }

    return res.status(404).json({
      success: false,
      message: "Account not found. Please create one!",
    });
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
    const { role } = req.body;
    if (role === "user") {
      res.clearCookie("userToken", {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      });
    } else if (role === "owner") {
      res.clearCookie("ownerToken", {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      });
    } else {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    res
      .status(200)
      .json({ success: true, message: "User logged out successfully" });
  } catch (error) {
    console.error("Error logging out user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const createOrder = async (req, res) => {
  const { amount } = req.body;

  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt: `receipt_order_${Math.random() * 1000}`,
  };
  try {
    const order = await razorpay.orders.create(options);
    res.json({ order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order creation failed" });
  }
};

const updateTurfBookedSlots = async (turfId, bookingDetails) => {
  const turf = await turfModel.findById(turfId);

  const exists = turf.bookedSlots.find(
    (entry) => entry.date === bookingDetails.date
  );

  if (exists) {
    await turfModel.updateOne(
      { _id: turfId, "bookedSlots.date": bookingDetails.date },
      {
        $push: {
          "bookedSlots.$.slots": bookingDetails.slots[0],
        },
      }
    );
  } else {
    await turfModel.updateOne(
      { _id: turfId },
      {
        $push: {
          bookedSlots: {
            date: bookingDetails.date,
            slots: bookingDetails.slots,
          },
        },
      }
    );
  }
};
const verifyOrder = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingDetails,
    } = req.body;

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

    const existingBooking = await Booking.findOne({ razorpay_payment_id });
    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: "Booking already exists",
      });
    }

    const overlappingBooking = await Booking.findOne({
      turfId: bookingDetails.turfId,
      date: bookingDetails.date,
      slots: {
        $elemMatch: {
          $or: bookingDetails.slots.map((slot) => ({
            start: slot.start,
            end: slot.end,
          })),
        },
      },
      status: { $ne: "cancelled" },
    });

    if (overlappingBooking) {
      return res.status(409).json({
        success: false,
        message: "One or more slots are already booked",
      });
    }

    await updateTurfBookedSlots(bookingDetails.turfId, bookingDetails);

    const userId = req.user?._id || bookingDetails.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Missing user ID for booking",
      });
    }

    const newBooking = await Booking.create({
      turfId: bookingDetails.turfId,
      userId,
      date: bookingDetails.date,
      slots: bookingDetails.slots,
      sport: bookingDetails.sport,
      slotFees: bookingDetails.slotFees,
      amountPaid: bookingDetails.amount,
      razorpay_payment_id,
      razorpay_order_id,
      paymentType: bookingDetails.paymentType,
      status: "confirmed",
      reminderSent: false,
    });

    const user = await User.findById(userId);
    const turf = await turfModel
      .findById(bookingDetails.turfId)
      .populate("owner", "fcmToken turfname");

    const slotTimeText = `${bookingDetails.slots[0].start} - ${bookingDetails.slots[0].end}`;
    const turfName = turf?.owner?.turfname || "your turf";


    if (user?.fcmToken) {
      try {
        console.log("📲 Sending push to USER", user.fcmToken);
        await admin.messaging().send({
          token: user.fcmToken,
          notification: {
            title: "✅ Booking Confirmed",
            body: `Your booking on ${bookingDetails.date} at ${slotTimeText} is confirmed at ${turfName}`,
          },
        });
      } catch (err) {
        console.error("❌ Failed to send user push:", err.code, err.message);
      }
    } else {
      console.warn("⚠️ No user FCM token found");
    }

    if (turf?.owner?.fcmToken) {
      try {
        console.log("📲 Sending push to OWNER", turf.owner.fcmToken);
        await admin.messaging().send({
          token: turf.owner.fcmToken,
          notification: {
            title: "📅 New Booking Alert",
            body: `New booking on ${bookingDetails.date} at ${slotTimeText} at ${turfName}`,
          },
        });
      } catch (err) {
        console.error("❌ Failed to send owner push:", err.code, err.message);
        if (err.code === "messaging/registration-token-not-registered") {
          await Owner.findByIdAndUpdate(turf.owner._id, { fcmToken: null });
        }
      }
    } else {
      console.warn("⚠️ No owner FCM token found");
    }

    // In-app notifications
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

    return res.status(200).json({
      success: true,
      message: "Payment verified and booking confirmed",
      booking: newBooking,
    });

  } catch (err) {
    console.error("💥 Payment verification error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};




const getAllBookings = async (req, res) => {
  try {
    const { data: user, role } = req.user;
    const userId = user._id;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "Unauthorised, Login First" });
    }
    const allBookings = await Booking.find({ userId: userId });
    res.status(200).json({ success: true, allBookings: allBookings });
  } catch (error) {
    console.log("Error to Fetch Bookings", error);
    return res.status(500).json({
      success: false,
      message: "Fetch Bookings Error",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId, email, isNotification, preferredTime, playerId } = req.body;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "Unauthorised, Login First" });
    }
    console.log("Update User Data:", req.body);
    const updateFields = {};
    if (email) updateFields.email = email;
    if (typeof isNotification !== "undefined")
      updateFields.isNotification = isNotification;
    if (preferredTime) updateFields.preferredTime = preferredTime;
    if (playerId) updateFields.fcmToken = playerId;

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
    const slotTime = booking.slots[0]?.start; // e.g. '06:00 PM'

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
        role:"owner",
        title: "Booking Reminder",
        owner: booking.turfId.owner,
        message: "New booking is in 10 minutes",
        type: "reminder"
      });}

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

const getFavoriteTurfs = async (req, res) => {
  try {
    const { data: user, role } = req.user;
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
    const { data: user, role } = req.user;

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
    let notifications =[];
    if(req.user){
      const { data: user } = req.user;
      notifications = await Notification.find({ user: user._id, role: "user" })
      .sort({ createdAt: -1 })
      .limit(20);
    }else if(req.owner){
      const { data: owner } = req.owner;
      notifications = await Notification.find({ owner: owner._id, role: "owner" })
      .sort({ createdAt: -1 })
      .limit(20);
    
    }

    if (!notifications || notifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No notifications found",
      });
    }
    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      
    });
  }
};

module.exports = {
  userRegister,
  userLogout,
  createOrder,
  verifyOrder,
  getAllBookings,
  updateUser,
  deleteUser,
  addFavorite,
  getFavoriteTurfs,
  login,
  getAllNotifications,
  removeFavoriteTurf,
};

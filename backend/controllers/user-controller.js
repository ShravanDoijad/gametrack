const User = require("../models/user-model");
const { sendOtp, verifyOtp } = require("./otp-controller");
const { validationResult } = require('express-validator');
const jwt = require("jsonwebtoken")
const Razorpay = require("razorpay");
const crypto = require('crypto')
const Booking = require("../models/booking-model");
const turfModel = require("../models/turf-model");
const admin = require("../firebase-admin")

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

const userRegister = async (req, res) => {
  try {
    const { phone, email, name } = req.body;

    if (!phone && !email) {
      return res.status(400).json({
        success: false,
        message: "Either phone or email is required",
      });
    }

    let user;

    // 👇 Case 1: Login via phone
    if (phone) {
      user = await User.findOne({ phone });
      if (!user) {
        user = await User.create({
          phone,
          fullname: "Guest",
          isVerified: true,
        });
      }

      // 👇 Case 2: Login via Google/email
    } else if (email) {
      user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          email,
          fullname: name || "Google User",
          isVerified: true,
        });
      }
    }

    // 🔐 Token Payload
    const payload = phone ? { phone } : { email };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("userToken", token, {
      httpOnly: true,
      secure: false,

      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ success: true, token });
  } catch (error) {
    console.error("Unified login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const userLogout = async (req, res) => {
  try {
    res.clearCookie("userToken");
    res.status(200).json({ success: true, message: "User logged out successfully" });
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
}

const updateTurfBookedSlots = async (turfId, bookingDetails) => {
  const turf = await turfModel.findById(turfId);
  console.log("turf", turf)
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


    const { razorpay_order_id,userId, razorpay_payment_id, razorpay_signature, bookingDetails } = req.body;
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.
      createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(sign.toString())
      .digest("hex")

    const existingBooking = await Booking.findOne({
      razorpay_payment_id,
    });
    if (existingBooking) {
      return res.status(409).json({ success: false, message: "Booking already exists" });
    }


    if (razorpay_signature !== expectedSignature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const isAlreadyBooked = await Booking.findOne({
      turfId: bookingDetails.turfId,
      date: bookingDetails.date,
      'slots.start': bookingDetails.slots[0].start,
      'slots.end': bookingDetails.slots[0].end,
      status: { $ne: 'cancelled' }
    });

    if (isAlreadyBooked) {
      return res.status(409).json({
        success: false,
        message: "This slot is already booked"
      });
    }


    await updateTurfBookedSlots(bookingDetails.turfId, bookingDetails)

    const newBooking = await Booking.create({
      turfId: bookingDetails.turfId,
      userId: bookingDetails.userId,
      date: bookingDetails.date,
      slots: bookingDetails.slots,
      sport: bookingDetails.sport,
      amountPaid: bookingDetails.amount,
      razorpay_payment_id,
      razorpay_order_id,
      paymentType: bookingDetails.paymentType,
      status: "confirmed",
    });

    const user = await User.findById(userId)
    admin.messaging().send({
      token: user.fcmToken,
      notification: {
        title: "Booking Confirmed",
        body: "You're all set for 7PM today",
      }
    });




    return res.status(200).json({
      success: true,
      message: "Payment verified and booking confirmed",
      booking: newBooking,
    });

  } catch (err) {
    console.log("Payment Integration Error", err)
    return res.status(500).json({ success: false, message: "DB error", error: err.message });
  }
}

const getAllBookings = async (req, res) => {
  try {
    let query = {}
     if (req.user.phone) {
    query.phone = req.user.phone;
  } else if (req.user.email) {
    query.email = req.user.email;
  } else if (req.user._id) {
    query._id = req.user._id;
  } 
    const user = await User.findOne(query);
   

    const userId = user._id
    

    if (!userId) {
      return res.status(400).json({ success: false, message: "Unauthorised, Login First" })
    }
    const allBookings = await Booking.find({ userId: userId })
    res.status(200).json({ success: true, allBookings: allBookings })

  } catch (error) {
    console.log("Error to Fetch Bookings", error)
    return res.status(500).json({ success: false, message: "Fetch Bookings Error", error: err.message });
  }
}

const updateUser = async (req, res) => {
  try {
    const { userId, email, isNotification, preferredTime } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "Unauthorised, Login First" })
    }
    let updatedUser = await User.findByIdAndUpdate(userId, {
      email: email,
      isNotification: isNotification,
      preferredTime: preferredTime
    })

    res.status(200).json({ success: true, updatedUser: updateUser, message: "User Updated Successfully" })


  } catch (err) {
    console.log("Error to Update User", err)
    res.status(200).json({
      success: false,
      message: "Can not Update User",
      error: err.message
    })
  }

}

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "Allready Have not any Account, Login First" })
    }
    await User.findByIdAndDelete(userId)

    res.status(200).json({ success: true, message: "User Deleted Successfully" })


  } catch (err) {
    console.log("Error to Delete User", err)
    res.status(200).json({
      success: false,
      message: "Can not Delete User",
      error: err.message
    })
  }
}


const addFavorite = async (req, res) => {
  try {
    const { userId, turfId } = req.body;

    if (!userId || !turfId) {
      return res.status(400).json({ message: "User ID and Turf ID are required." });
    }

    const user = await User.findById(userId);

    const turf = await turfModel.findById(turfId);
    if (!user || !turf) {
      return res.status(404).json({ message: "User or Turf not found." });
    }

    if (user.favoriteTurfs.includes(turfId)) {
      return res.status(409).json({ message: "Turf is already in favoriteTurfs." });
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







module.exports = {
  userRegister,
  userLogout,
  createOrder,
  verifyOrder,
  getAllBookings,
  updateUser,
  deleteUser,
  addFavorite

}; 
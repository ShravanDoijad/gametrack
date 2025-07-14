const User = require("../models/user-model");
const { sendOtp, verifyOtp } = require("./otp-controller");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Booking = require("../models/booking-model");
const turfModel = require("../models/turf-model");
const bcrypt = require("bcryptjs");
const Owner = require("../models/owner-model");
const axios = require("axios");

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
    if(existingUser){
    if ( existingUser.isVerified) {
      return res.status(409).json({
        success: false,
        message: "User already exists. Please login.",
      });
    }
    else{
      console.log("existing user", existingUser.phone);
      await sendOtp({ identifier: existingUser.phone, role: 'user' });
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

    await sendOtp({ identifier: phone, role:'user' });

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
      email: identifier 
    });

    if (owner) {
      const result = await sendOtp({ identifier, role: 'owner' });
      return res.status(200).json({
        success: true,
        message: `OTP sent to owner account`,
      });
    }

    
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    });

    if (user) {
      const result = await sendOtp({ identifier, role: 'user' });
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
    res.clearCookie("userToken",
      {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      }
    );
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
      userId,
      razorpay_payment_id,
      razorpay_signature,
      bookingDetails,
    } = req.body;
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(sign.toString())
      .digest("hex");

    const existingBooking = await Booking.findOne({
      razorpay_payment_id,
    });
    if (existingBooking) {
      return res
        .status(409)
        .json({ success: false, message: "Booking already exists" });
    }

    if (razorpay_signature !== expectedSignature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    const isAlreadyBooked = await Booking.findOne({
      turfId: bookingDetails.turfId,
      date: bookingDetails.date,
      "slots.start": bookingDetails.slots[0].start,
      "slots.end": bookingDetails.slots[0].end,
      status: { $ne: "cancelled" },
    });

    if (isAlreadyBooked) {
      return res.status(409).json({
        success: false,
        message: "This slot is already booked",
      });
    }

    await updateTurfBookedSlots(bookingDetails.turfId, bookingDetails);

    const newBooking = await Booking.create({
      turfId: bookingDetails.turfId,
      userId: bookingDetails.userId,
      date: bookingDetails.date,
      slots: bookingDetails.slots,
      sport: bookingDetails.sport,
      slotFees: bookingDetails.slotFees,
      amountPaid: bookingDetails.amount,
      razorpay_payment_id,
      razorpay_order_id,
      paymentType: bookingDetails.paymentType,
      status: "confirmed",
    });
    const user = await User.findById(bookingDetails.userId);
    if (user?.playerId) {
      await sendNotification({
    playerId: user.playerId,
    message: "Your turf booking is confirmed!",
    heading: "Booking Confirmed"
  });
    }

   

    return res.status(200).json({
      success: true,
      message: "Payment verified and booking confirmed",
      booking: newBooking,
    });
  } catch (err) {
    console.log("Payment Integration Error", err);
    return res
      .status(500)
      .json({ success: false, message: "DB error", error: err.message });
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
    return res
      .status(500)
      .json({
        success: false,
        message: "Fetch Bookings Error"
        
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
    let updatedUser = await User.findByIdAndUpdate(userId, {
      email: email,
      playerId:playerId,
      isNotification: isNotification,
      preferredTime: preferredTime,
    });

    res
      .status(200)
      .json({
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

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res
        .status(400)
        .json({
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


const sendNotification = async ({ playerId, message, heading }) => {
  return await axios.post("https://onesignal.com/api/v1/notifications", {
    app_id: process.env.ONESIGNAL_APP_ID,
    include_player_ids: [playerId],
    contents: { en: message },
    headings: { en: heading },
  }, {
    headers: {
      Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      "Content-Type": "application/json",
    },
  });
};





const getFavoriteTurfs = async (req, res) => {
  try {
    const {data:user, role} = req.user;
    const customer = await User.findById(user._id).populate("favoriteTurfs", "_id name location avarageRating images dayPrice nightPrice");
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
    res
      .status(500)
      .json({
        success: false,
        message: "Can't fetch favorite Turfs", error: error });
  }
};

const removeFavoriteTurf = async (req, res) => {
  try {
    const {turfId} = req.body;
    const {data:user, role} = req.user;

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
    res.status(500).json({ message: "Server error. Couldn't remove favorite turf." });
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
  sendNotification,
  removeFavoriteTurf,
  
};

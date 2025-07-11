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
    const { phone, email, password } = req.body;

    if ((!phone && !email) || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone or email and password are required.",
      });
    }

    // Check if user already exists
    let existingUser = phone
      ? await User.findOne({ phone })
      : await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists. Please login.",
      });
    }

    
    const hashedPassword = await User.hashPassword(password); 

    // Create user
    const newUser = await User.create({
      fullname: "Guest",
      password: hashedPassword,
      isVerified: true,
      ...(phone && { phone }),
      ...(email && { email }),
    });

    const payload = {
      id: newUser._id,
      role: "user",
      ...(email && { email }),
      ...(phone && { phone }),
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("userToken", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "User registered successfully",
      token,
      role: "user",
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
    const { phoneOrEmail, password } = req.body;
    console.log("Login attempt with:", phoneOrEmail, password);

    if (!phoneOrEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone/email and password are required",
      });
    }

    let account, role;

    const user = await User.findOne({
      $or: [{ phone: phoneOrEmail }, { email: phoneOrEmail }],
    }).select('+password');

    const owner = await Owner.findOne({
      $or: [{ phone: phoneOrEmail }, { email: phoneOrEmail }],
    }).select('+password');

    if (user) {
      account = user;
      role = "user";
    } else if (owner) {
      account = owner;
      role = "owner";
    } else {
      return res.status(404).json({
        success: false,
        message: "Account not found. Please create one!",
      });
    }

    const isMatch = await account.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const payload = {
      id: account._id,
      role,
      email: account.email,
      phone: account.phone,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const cookieName = role === "owner" ? "ownerToken" : "userToken";

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: false, // set to true in production with HTTPS
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};





const userLogout = async (req, res) => {
  try {
    res.clearCookie("userToken");
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
      await axios.post("https://onesignal.com/api/v1/notifications", {
        app_id: process.env.ONESIGNAL_APP_ID,
        include_player_ids: [user.playerId],
        contents: { en: "Your turf booking is confirmed!" },
        headings: { en: "Booking Confirmed" },
      }, {
        headers: {
          Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
          "Content-Type": "application/json"
        }
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
        updatedUser: updateUser,
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


const sendNotification = async (req, res) => {
  const { playerId, message } = req.body;

  try {
    const response = await axios.post(
      "https://onesignal.com/api/v1/notifications",
      {
        app_id: process.env.ONESIGNAL_APP_ID,
        include_player_ids: [playerId],
        contents: { en: message },
        headings: { en: "Turf Booking Alert!" },
      },
      {
        headers: {
          Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error("Push failed:", error.response?.data || error);
    res.status(500).json({ success: false, error: "Failed to send notification" });
  }
};




const getFavoriteTurfs = async (req, res) => {
  try {
    const {data:user, role} = req.user;
    const customer = await User.findById(user._id).populate("favoriteTurfs");
    if (!customer) {
      return res
        .status(401)
        .json({ message: "Unauthorized, login to Proceed" });
    }
   
    console.log("user favorite turfs", customer.favoriteTurfs);
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
  
};

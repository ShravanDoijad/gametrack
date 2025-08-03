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
const { sendMessage, OwnerUpdate, UserSubscriptionUpdate, OwnerSubscriptionUpdate } = require("../twilio/sendMessage");
const bookingModel = require("../models/booking-model");
const subscriptionModel = require('../models/subscription-model')
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

const createOrder = async (req, res) => {
  const { amount, receipt, bookingDetails, subscriptionDetails } = req.body;

  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt: receipt,
  };


  try {


    if (subscriptionDetails) {
      const { turfId, userId, fromDate, toDate, slot } = subscriptionDetails;
      const existingUserBooking = await subscriptionModel.findOne({
        turfId,
        userId,
        fromDate,
        slot: {
          $elemMatch: {
            start: { $lt: subscriptionDetails.slot.end },
            end: { $gt: subscriptionDetails.slot.start }
          }
        },


        // status: { $ne: "cancelled" },
      });

      if (existingUserBooking) {
        return res.status(409).json({
          success: false,
          message: "You've already booked one of these slots",
        });
      }

      const overlappingBooking = await Booking.findOne({
        turfId: subscriptionDetails.turfId,
        date: subscriptionDetails.date,
        slots: {
          $elemMatch: {
            start: { $lt: subscriptionDetails.slot.end },
            end: { $gt: subscriptionDetails.slot.start }
          }
        },
        status: { $ne: "cancelled" },
      });

      if (overlappingBooking) {
        return res.status(409).json({
          success: false,
          message: "One or more slots are already booked",
        });
      }

      const order = await razorpay.orders.create(options);
      return res.json({ order });

    } else {
      const { turfId, userId, date, slots } = bookingDetails




      const existingUserBooking = await Booking.findOne({
        turfId,
        userId,
        date,
        slots: {
          $elemMatch: {
            $or: bookingDetails?.slots.map((slot) => ({
              start: { $lt: slot.end },
              end: { $gt: slot.start },
            })),
          },
        },

        status: { $ne: "cancelled" },
      });

      if (existingUserBooking) {
        return res.status(409).json({
          success: false,
          message: "You've already booked one of these slots",
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

      const order = await razorpay.orders.create(options);
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

    // Create new subscription slot object
    const newSubscriptionSlot = {
      user: subscriptionDetails.userId, // assuming userId is passed in subscriptionDetails
      fromDate: subscriptionDetails.fromDate, // "YYYY-MM-DD"
      toDate: subscriptionDetails.toDate,     // "YYYY-MM-DD"
      slot: {
        start: subscriptionDetails.slot.start, // "HH:MM" format
        end: subscriptionDetails.slot.end     // "HH:MM" format
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
    const {data:user, role} = req.auth
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingDetails,
      subscriptionDetails
    } = req.body;

    console.log(subscriptionDetails)
    const userId = user._id || details.userId;


    const details = subscriptionDetails ? subscriptionDetails : bookingDetails

    const userData = await User.findById(userId);

    console.log("user", userData)

    const turf = await turfModel
      .findById(details.turfId)
      .populate("owner", "fcmTokens turfname phone");

      const turfName = turf?.owner?.turfname || "your turf";

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


    if (!subscriptionDetails) {
      await updateTurfBookedSlots(details.turfId, details);
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
      newBooking = await subscriptionModel.create({
        turfId: subscriptionDetails.turfId,
        userId,
        startDate: subscriptionDetails.fromDate,
        endDate: subscriptionDetails.toDate,
        slot: subscriptionDetails.slot,
        sport: subscriptionDetails.sport,
        durationDays: subscriptionDetails.durationDays,
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
        amountPaid: bookingDetails.amount,
        razorpay_payment_id,
        razorpay_order_id,
        paymentType: bookingDetails.paymentType,
        status: "confirmed",
        reminderSent: false,
      });
    }
    
    if (!subscriptionDetails) {

      const slotTimeText = `${bookingDetails.slots[0].start} - ${bookingDetails.slots[0].end}`;



      await sendMessage({
        phoneNumber: userData.phone,
        notification_data: {
          name: userData.fullname.split(" ")[0],               // {{1}}
          turfName: turfName,                              // {{2}}
          date: bookingDetails.date,                       // {{3}}
          time: slotTimeText,                              // {{4}}
          location: turf.location.city,                          // {{5}} - You need to add this value
          amount: bookingDetails.slotFees,                 // {{6}}
          sport: newBooking.sport,                         // {{7}}
          advance: newBooking.amountPaid,                  // {{8}}
          remaining: bookingDetails.slotFees - newBooking.amountPaid // {{9}}
        }
      });

      await OwnerUpdate({
        phoneNumber: turf.owner.phone,
        notification_data: {
          user: userData.fullname,
          phone: userData.phone,
          date: bookingDetails.date,
          slotStart: newBooking.slot.start,
          slotEnd: newBooking.slot.end,
          duration: newBooking.slot.duration, // e.g., "1" or "90"
          sport: newBooking.sport,
          total: newBooking.slotFees,
          advance: newBooking.amountPaid,
          remained: newBooking.status === "cancelled" ? 0 : (newBooking.slotFees - newBooking.amountPaid)
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
    }
    else if(subscriptionDetails){
      
     await updateSubscriptionSlots(subscriptionDetails.turfId, subscriptionDetails)
      await UserSubscriptionUpdate({
  phoneNumber: userData.phone,
  notification_data: {
    name: userData.fullname,
    turfName: turf.name,
    fromDate: subscriptionDetails.fromDate,
    toDate: subscriptionDetails.toDate,
    totalDays:subscriptionDetails.durationDays,
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
    fromDate: subscriptionDetails.fromDate,
    toDate: subscriptionDetails.toDate,
    totalDays:subscriptionDetails.durationDays,
    slotStart: subscriptionDetails.slot.start,
    slotEnd: subscriptionDetails.slot.end,
    duration: subscriptionDetails.slot.duration,
    total: subscriptionDetails.totalAmount,
    advance: subscriptionDetails.advanceAmount,
    remaining: subscriptionDetails.totalAmount - subscriptionDetails.advanceAmount
  }
});



    }
    return res.status(200).json({
      success: true,
      message: "Payment verified and booking confirmed",
      booking: newBooking,
    });

  } catch (err) {
    console.error(" Payment verification error:", err);
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
    console.log("all bookings", allBookings)
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
    const { userId, email, isNotification, preferredTime, fcmToken } = req.body;
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
    if (fcmToken) updateFields.fcmToken = fcmToken;

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


const getPendingReviews = async (req, res) => {
  try {
    const { data: user, role } = req.auth;
    const currentTime = new Date();

    // Step 1: Get all bookings of the user
    const bookings = await bookingModel.find({ userId: user._id }).populate("turfId");

    // Step 2: Filter past bookings that don't already have a review
    const pendingReviews = [];

    for (let booking of bookings) {
      const bookingDate = new Date(booking.date);
      const [endHour, endMinute] = booking.slots.end.split(":").map(Number);
      bookingDate.setHours(endHour, endMinute);

      const turf = booking.turfId;

      // Check if the slot has ended AND the user hasn't reviewed this turf
      const alreadyReviewed = turf.reviews.some(
        (rev) => rev.user.toString() === user._id.toString()
      );

      if (bookingDate < currentTime && !alreadyReviewed) {
        pendingReviews.push({
          turfId: turf._id,
          turfName: turf.name,
          bookingId: booking._id,
          bookingDate: booking.date,
          startTime: booking.slots.start,
          endTime: booking.slots.end,
        });
      }
    }

    return res.status(200).json({ success: true, pendingReviews });

  } catch (error) {
    console.error("Error in getPendingReviews:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const submitReview = async (req, res) => {
  try {
    const { data: user } = req.auth;
    const { bookingId, turfId, rating, comment } = req.body;

    const userBooking = await bookingModel.findById(bookingId);
    if (!userBooking) {
      return res.status(400).json({ message: 'User booking not found' });
    }

    if (userBooking.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

    // Optional: Check if booking has ended
    const currentTime = new Date();
    const bookingDateTime = new Date(`${userBooking.date}T${userBooking.endTime}`);
    if (currentTime < bookingDateTime) {
      return res.status(400).json({ message: 'You can review only after the slot ends' });
    }

    // Optional: Check if already reviewed
    if (userBooking.isReviewed) {
      return res.status(400).json({ message: 'You already submitted a review for this booking' });
    }

    const turf = await turfModel.findById(turfId);
    if (!turf) {
      return res.status(400).json({ message: 'Turf not found' });
    }
    const alreadyReviewed = turf.reviews.find(
      (rev) => rev.user.toString() === user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: "You've already reviewed this turf." });
    }


    turf.reviews.push({
      user: user._id,
      name: user.fullname?.split(" ")[0] || user.fullname,
      rating,
      comment
    });

    userBooking.isReviewed = true;

    await turf.save();
    await userBooking.save();

    return res.status(200).json({ message: 'Review submitted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while submitting review' });
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
  getBookedSlots,
  getPendingReviews,
  submitReview,

  getSubscriptionSlots

};


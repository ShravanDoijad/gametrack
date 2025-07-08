const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullname: {
    type: String,
    default: "Guest",
    trim: true,
  },
  phone: {
    type: String,
    unique: true,
    sparse: true, // ✅ Allows multiple docs with no phone
  },
  email: {
    type: String,
    unique: true,
    sparse: true, // ✅ Allows multiple docs with no email
    lowercase: true,
    trim: true,
  },
  
  isVerified: {
    type: Boolean,
    default: false,
  },
  favoriteTurfs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Turf",
    },
  ],
  registeredAt: {
    type: Date,
    default: Date.now,
  },
  fcmToken: {
  type: String,
  default: ""
},

  preferences: {
    preferredTime: { type: String, default: "" },
    notifyOnBooking: { type: Boolean, default: true },
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  otpExpiresAt: Date,
});

const User = mongoose.model("User", UserSchema);
module.exports = User;

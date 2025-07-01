const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    default: "",
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

const user = mongoose.model('User', UserSchema)
module.exports = user;
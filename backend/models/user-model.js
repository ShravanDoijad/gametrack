const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const UserSchema = new mongoose.Schema({
  fullname: {
    type: String,
    default: "Guest",
    trim: true,
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true, // ✔️ Now required for auth
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
    default: "",
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



 UserSchema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password, this.password)
}

UserSchema.statics.hashPassword = async function (password) {
    return await bcrypt.hash(password, 10)
}

const User = mongoose.model("User", UserSchema);
module.exports = User;

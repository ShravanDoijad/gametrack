const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
  identifier: { 
    type: String,
    required: true,
    
  },
  role: { 
    type: String,
    enum: ['user', 'owner'],
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    default: () => Date.now() + 5 * 60 * 1000,
  }
});
OtpSchema.index({ identifier: 1, type: 1 }, { unique: true });
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Otp", OtpSchema);

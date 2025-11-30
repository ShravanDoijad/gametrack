const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  turfId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Turf",
    required: true,
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // ───────────── DATE RANGE ─────────────
  startDate: {
    type: Date,
    required: true,
  },

  endDate: {
    type: Date,
    required: true,
  },

  durationDays: {
    type: Number,
    enum: [7, 15, 30, 60, 90],
    required: true
  },

  // ───────────── TIME SLOT ─────────────
  slot: {
    start: { type: String, required: true }, // "06:00"
    end: { type: String, required: true }     // "07:00"
  },

  daysOfWeek: {
    type: [String], // ["Mon", "Wed", "Fri"]
    required: true
  },

  sport: {
    type: String,
    required: true,
  },

  // ───────────── PAYMENT ─────────────
  amountPaid: {
    type: Number,
    required: true
  },

  totalAmount: {
    type: Number,
    required: true
  },

  paymentType: {
    type: String,
    enum: ['full', 'advance'],
    required: true
  },

  razorpay_payment_id: String,
  razorpay_order_id: String,

  // ───────────── STATUS ─────────────
  status: {
    type: String,
    enum: ['active', 'paused', 'confirmed', 'cancelled'],
    default: 'active'
  },

  autoRenew: {
    type: Boolean,
    default: false
  },

  // ───────────── ATTENDANCE ─────────────
  attendance: [
    {
      date: Date,
      status: {
        type: String,
        enum: ['present', 'absent'],
        default: 'present'
      }
    }
  ],

  // ───────────── SYSTEM/FOLLOWUP ─────────────
  lastReminderSent: Date,
  cancellationDate: Date,
  cancellationReason: String

}, { timestamps: true });

module.exports = mongoose.model("Subscription", subscriptionSchema);

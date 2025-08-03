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
  startDate: {
    type: String, // Store as "YYYY-MM-DD"
    required: true,
  },
  endDate: {
    type: String, // Store as "YYYY-MM-DD"
    required: true,
  },
  durationDays: {
    type: Number,
    required: true,
    enum: [7, 15, 30, 60, 90] 
  },
  slot: {
    start: {
      type: String,
      required: true
    },
    end: {
      type: String,
      required: true
    }
  },
  sport: {
    type: String,
    required: true
  },
  amountPaid:{
    type: Number,
    required: true
  },
  
  totalAmount: {
    type: Number,
    required: true
  },
  paymentType: {
    type: String,
    required: true,
    enum: ['full', 'advance'] // Match your payment options
  },
  razorpay_payment_id: String,
  razorpay_order_id: String,
  status: {
    type: String,
    enum: ['active', 'confirmed', 'cancelled'],
    default: 'active'
  },
  // To track which dates have been used/attended

  // For tracking reminders
  lastReminderSent: Date,
  // For cancellation policy
  cancellationDate: Date,
  cancellationReason: String
}, { timestamps: true });

// Pre-save hook to generate attendance records


module.exports = mongoose.model("Subscription", subscriptionSchema);
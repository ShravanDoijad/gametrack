const mongoose = require("mongoose")

const bookingSchema = new mongoose.Schema({
  turfId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Turf",
    required: true,
  },
  fullname:{
    type:String,
    default:"Guest"
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  phone: {
    type: String,
  },
  sport: { type: String, default: "General" },
  notes: { type: String, maxlength: 500 },
  date: {
    type: Date,
    required: true,
  },
  slotFees: {
    type: Number,
    required: true,
  },
  slots: [
    {
      start: String,
      end: String   
    }
  ],
  amountPaid: Number,
  paymentHistory: [
    {
      amount: { type: Number, required: true, min: 0 },
      method: { type: String, enum: ["cash", "upi", "online", "other"], required: true },
      receivedAt: { type: Date, default: Date.now },
      recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", default: null },
      reference: String,
    },
  ],

  originalPrice:Number,
  finalPrice:Number,
  razorpay_payment_id: String,
  
  razorpay_order_id: String,
  paymentType:{
    type:String,
    required: true,
  },
   reminderSent: { type: Boolean, default: false },
  isReviewed: { type: Boolean, default: false },
   status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'confirmed',
  },
}, { timestamps: true });

module.exports= mongoose.model("Booking", bookingSchema);

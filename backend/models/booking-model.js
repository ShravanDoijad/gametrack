const mongoose = require("mongoose")

const bookingSchema = new mongoose.Schema({
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
  date: {
    type: String, // Store as "YYYY-MM-DD"
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
  razorpay_payment_id: String,
  razorpay_order_id: String,
  paymentType:{
    type:String,
    required: true,
  },
   status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'confirmed',
  },
}, { timestamps: true });

module.exports= mongoose.model("Booking", bookingSchema);

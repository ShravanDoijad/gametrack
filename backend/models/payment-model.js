const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    orderId: {
      type: String,
      required: true,
      unique: true
    },

    amount: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: ["created", "attempted", "paid", "failed", "expired"],
      default: "created"
    },

    // For normal booking
    booking: {
      turfId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Turf"
      },
      date: String,
      slots: [
        {
          start: String,
          end: String
        }
      ]
    },

    // For subscription
    subscription: {
      turfId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Turf"
      },
      fromDate: String,
      toDate: String,
      slot: {
        start: String,
        end: String
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);

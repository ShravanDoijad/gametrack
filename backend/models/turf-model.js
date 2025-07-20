const mongoose = require("mongoose");

const TurfSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  location: {
    address: String,
    city: String,
    pincode: String,
    coordinates: {
      type: [Number],
      index: "2dsphere",
    },
  },

  images: {
    type: [String],
    required: true,
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Owner",
    required: true,
  },

  dayPrice: {
    type: Number,
    required: true,
  },

  nightPrice: {
    type: Number,
    required: true,
  },

  sportsAvailable: {
    type: [String],
    required: true,
  },

  bookedSlots: [
    {
      date: String, 
      slots: [
        {
          start: String,
          end: String,
        },
      ],
       status: {
          type: String,
          enum: ["available", "booked", "unavailable"],
          default: "available",
        },
    },
  ],

  openingTime: String,
  closingTime: String,

  allowAdvancePayment: {
    type: Boolean,
    default: true,
  },
  allowFullPaymentOnly: {
    type: Boolean,
    default: false,
  },
  allowTournaments: {
    type: Boolean,
    default: false,
  },

  amenities: [String],

 
  reviews: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: String,
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      date: { type: Date, default: Date.now },
    },
  ],

  averageRating: {
    type: Number,
    default: 0,
  },

  likes: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      likedAt: { type: Date, default: Date.now },
    },
  ],

 
  subscription: {
    type: String,
    enum: ["Free", "Basic", "Pro", "Enterprise"],
    default: "Free",
  },

  onSitePolicies: {
    type: [String], 
    default: [],
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Turf", TurfSchema);

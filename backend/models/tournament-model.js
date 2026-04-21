// models/tournament-model.js
const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema(
  {
    turfId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Turf",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Array of "YYYY-MM-DD" strings — one slot is blocked per date
    dates: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => v.length > 0,
        message: "At least one date is required",
      },
    },
    startTime: {
      type: String, // "HH:MM" 24h
      required: true,
    },
    endTime: {
      type: String, // "HH:MM" 24h
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tournament", tournamentSchema);

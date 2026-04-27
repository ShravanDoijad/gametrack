const mongoose = require("mongoose");

const whatsappSessionSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true
  },
  step: {
    type: String,
    enum: ['IDLE', 'SELECT_TURF', 'SELECT_DATE', 'SELECT_SLOT', 'PLAYERS_COUNT', 'PAYMENT'],
    default: 'IDLE'
  },
  data: {
    type: Object,
    default: {}
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
    expires: 900 // Automatically delete the session after 15 minutes (900 seconds) of inactivity
  }
});

// Update the lastUpdated timestamp on every save
whatsappSessionSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model("WhatsAppSession", whatsappSessionSchema);

const mongoose = require('mongoose');

const OwnerSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
    trim: true,
  },
  turfname: {
    type: String,
    required: true,
    trim: true,
  },
  turfId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Turf',
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  isverified: {
    type: Boolean,
    default: false,
  },
  atcreated: {
    type: Date,
    default: Date.now,
  },
});

const Owner = mongoose.model("Owner", OwnerSchema)

module.exports =  Owner ;
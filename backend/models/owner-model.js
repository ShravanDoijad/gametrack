const mongoose = require('mongoose');

const OwnerSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email:{
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


});
const owner = mongoose.model('Owner', OwnerSchema)
module.exports = owner;
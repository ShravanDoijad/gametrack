const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  fcmToken: {
    type: String,
    default: null, 
  },
  atcreated: {
    type: Date,
    default: Date.now,
  },
});


 OwnerSchema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password, this.password)
}

OwnerSchema.statics.hashPassword = async function (password) {
    return await bcrypt.hash(password, 10)
}


const Owner = mongoose.model("Owner", OwnerSchema);
module.exports = Owner;

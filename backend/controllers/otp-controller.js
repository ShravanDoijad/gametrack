const jwt = require('jsonwebtoken');
const User = require('../models/user-model');
const Owner = require('../models/owner-model');
const Otp = require('../models/otp-model');
const crypto = require('crypto');
const { sendWhatsAppTemplate } = require('../twilio/sendMessage');

function generateOtp(length = 6) {
  return crypto.randomInt(100000, 1000000).toString();
}


async function sendOtp({ identifier, role }) {
  let targetPhone;
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  try {
    if (role === 'owner') {
      const owner = await Owner.findOne({ email: identifier });
      if (!owner) {
        return { success: false, message: 'Owner not found.' };
      }
      targetPhone = owner.phone
    }
    else if (role === 'user') {
      targetPhone = identifier;
    }
    else {
      return { success: false, message: 'Invalid role.' };
    }

    try {
      await Otp.findOneAndUpdate(
        { identifier: targetPhone, role },
        { $set: { otp, expiresAt }, $setOnInsert: { identifier: targetPhone, role } },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
    } catch (otpWriteError) {
      if (otpWriteError.code !== 11000) throw otpWriteError;

      // A second login request can race the upsert. If the first request has
      // already created this OTP, let it send the message instead of failing
      // with a duplicate-key error or replacing the code it is about to send.
      const concurrentOtp = await Otp.findOne({ identifier: targetPhone, role });
      if (concurrentOtp) {
        return { success: true, message: 'An OTP request is already being processed. Please check WhatsApp shortly.' };
      }

      // Legacy databases may still have a unique index on `identifier` alone.
      // Reuse that record if this same phone is entering through another role.
      const legacyOtp = await Otp.findOne({ identifier: targetPhone });
      if (!legacyOtp) throw otpWriteError;
      await Otp.updateOne(
        { identifier: targetPhone },
        { $set: { role, otp, expiresAt } },
        { runValidators: true }
      );
    }

    const message = await sendWhatsAppTemplate({
      phoneNumber: targetPhone,
      contentSid: process.env.TWILIO_CONTENT_SID,
      templateName: "TWILIO_CONTENT_SID",
      variables: { 1: otp, 2: "5 minutes" },
    });
    console.log("OTP WhatsApp template sent:", message.sid);
    return { success: true, message: 'OTP sent successfully' };
  } catch (err) {
    if (targetPhone) await Otp.deleteOne({ identifier: targetPhone, role, otp }).catch(() => {});
    console.error('Failed to send OTP:', {
      message: err.message,
      code: err.code,
      status: err.status,
      moreInfo: err.moreInfo,
      templateConfigured: Boolean(process.env.TWILIO_CONTENT_SID),
      senderConfigured: Boolean(process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER),
    });
    return { success: false, message: 'Could not send OTP. Please try again.' };
  }
}


const verifyOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    if (!identifier || !otp) {
      return res.status(400).json({ success: false, message: 'Credentials and OTP are required.' });
    }


    let role;
    let targetPhone;
    const owner = await Owner.findOne({ email: identifier });

    let user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });

    let name;
    if (owner) {
      role = 'owner';
      targetPhone = owner.phone;

    } else {
      role = 'user';
      targetPhone = identifier;
    } 


    const dbOtp = await Otp.findOne({ identifier: targetPhone, role: role });

    if (!dbOtp) {
      return res.status(400).json({ success: false, message: 'OTP not found or expired.' });
    }

    if (dbOtp.otp !== otp) {
      return res.status(401).json({ success: false, message: 'Invalid OTP.' });
    }

    if (dbOtp.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired.' });
    }


    let account;
    if (role === 'owner') {
      account = owner;
    }
    else  {
      account = user || await User.create(
        identifier.includes('@') ? { email: identifier.toLowerCase() } : { phone: identifier }
      );
    }
    name = account.fullname || "Guest";
    if (account) {
    account.isVerified = true;
    await account.save();
    };


    const payload = {
      id: account._id || null,
      role: role,
      email: account.email || null,
      phone: account.phone || identifier,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });


 
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: true, // true in production (HTTPS)
      sameSite: "None",
      maxAge: 30 * 86400000 // 1 day
    });

    await Otp.deleteMany({ identifier: targetPhone, role });

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully. User logged in.',
      token,
      role: payload.role, 
      name: name
    });
  } catch (err) {
    console.error('OTP Verification Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};





module.exports = {
  sendOtp,
  verifyOtp,
  generateOtp,
  
};

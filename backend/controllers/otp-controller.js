const jwt = require('jsonwebtoken');
const User = require('../models/user-model');
const Owner = require('../models/owner-model');
const Otp = require('../models/otp-model');

function generateOtp(length = 6) {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

async function sendOtp({ identifier, role }) {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  try {
    let targetPhone
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

    await Otp.deleteMany({ identifier: targetPhone, role });
    await Otp.create({ identifier: targetPhone, role, otp, expiresAt });

    client.messages
      .create({
        from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
        to: `whatsapp:+91${targetPhone}`,
        contentSid: process.env.TWILIO_CONTENT_SID,
        contentVariables: JSON.stringify({
          "1": otp,
          "2": "5 minutes"
        })
      })
      .then(message => console.log("send", message.sid))



    return ({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Failed to send OTP:', err);
    return { success: false };
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

    const user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });

    let name = user ? user.name : owner ? owner.name : null;
    if (owner) {
      role = 'owner';
      targetPhone = owner.phone;

    } else if (user) {
      role = 'user';
      targetPhone = identifier;
    } else {
      return res.status(404).json({ success: false, message: 'User not found. Please register first.' });
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
    else if (role === 'user') {
      account = user;
    }
    else {
      return res.status(404).json({ success: false, message: 'User not found. Please register first.' });
    }

    account.isVerified = true;
    await account.save();


    const payload = {
      id: account._id,
      role: role,
      email: account.email,
      phone: account.phone,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });


 
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: true, // true in production (HTTPS)
      sameSite: "None",
      maxAge: 30 * 86400000 // 1 day
    });

    await Otp.deleteMany({ identifier: identifier, role: role });

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully. User logged in.',
      token,
      role: payload.role,
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
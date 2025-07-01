
const jwt = require('jsonwebtoken');
const User = require('../models/user-model')

const authCheck = async(req, res) => {
  const token = req.cookies.userToken;

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized", isToken: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findOne({phone:decoded.phone})
    
    if (!user.isVerified) {
      return res.status(400).json({ success: false, message: "User is not verified, Login agin"})
    }
    res.status(200).json({ success: true, message: "User is authenticated",isToken:true, user: user });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ success: false, message: "Invalid token" });
  }
}

module.exports = {
  authCheck,
};
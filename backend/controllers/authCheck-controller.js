const jwt = require('jsonwebtoken');
const User = require('../models/user-model');

const authCheck = async (req, res) => {
  const token = req.cookies.userToken;

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized: No token", isToken: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ phone: decoded.phone }).select("-password -__v");

    if (!user || !user.isVerified) {
      return res.status(400).json({ success: false, message: "User not verified or invalid", isToken: false });
    }

    const { _id, fullname, phone, favoriteTurfs, email, preferences } = user;
    res.status(200).json({
      success: true,
      message: "User is authenticated",
      isToken: true,
      user: { _id, fullname, phone, email, favoriteTurfs, preferences }
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired", isToken: false });
    }
    res.status(401).json({ success: false, message: "Invalid token", isToken: false });
  }
};

module.exports = { authCheck };

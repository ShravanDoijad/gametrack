const jwt = require('jsonwebtoken')
const User =require("../models/user-model")

const Owner = require("../models/owner-model");

const userOrOwnerMiddleware = async (req, res, next) => {
  try {
    const { userToken, ownerToken } = req.cookies || {};

    if (!userToken && !ownerToken) {
      return res.status(401).json({ message: "Unauthorized. Please login as user or owner." });
    }

    // 🧠 Priority: User token check
    if (userToken) {
      try {
        const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-__v -password");

        if (user) {
          req.user = { data: user, role: "user" };
          return next();
        }
      } catch (err) {
        console.warn("Invalid user token:", err.message);
      }
    }

    // 🧠 Fallback: Owner token check
    if (ownerToken) {
      try {
        const decoded = jwt.verify(ownerToken, process.env.JWT_SECRET);
        const owner = await Owner.findById(decoded.id).select("-__v -password");

        if (owner) {
          req.owner = { data: owner, role: "owner" };
          return next();
        }
      } catch (err) {
        console.warn("Invalid owner token:", err.message);
      }
    }

    return res.status(401).json({ message: "Invalid or expired token." });
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = userOrOwnerMiddleware;


const adminMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.adminToken;

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized! Token missing.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (
      decoded.email !== process.env.ADMIN_EMAIL ||
      decoded.password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({ message: 'Unauthorized! Please login first.' });
    }

    next();
  } catch (error) {
    console.log('admin authentication error', error);
    return res.status(401).json({ message: 'Unauthorized! Invalid or expired token.' });
  }
};



module.exports = {
    userOrOwnerMiddleware,
    adminMiddleware
}
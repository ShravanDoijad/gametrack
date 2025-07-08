const jwt = require('jsonwebtoken')
const User =require("../models/user-model")

const Owner = require("../models/owner-model");

const userOrOwnerMiddleware = async (req, res, next) => {
  try {
    const userToken = req.cookies?.userToken;
    const ownerToken = req.cookies?.ownerToken;

    if (!userToken && !ownerToken) {
      return res.status(401).json({ message: "Unauthorized. Please login as user or owner." });
    }

    if (userToken) {
      try {
        const decodedUser = jwt.verify(userToken, process.env.JWT_SECRET);
        const user = await User.findOne({
          $or: [{ email: decodedUser.email }, { phone: decodedUser.phone }],
        }).select("-__v");

        if (user) {
          req.user = { data: user, role: decodedUser.role || "user" };
          return next();
        }
      } catch (err) {
        console.warn("User token invalid:", err.message);
      }
    }

    if (ownerToken) {
      try {
        const decodedOwner = jwt.verify(ownerToken, process.env.JWT_SECRET);
        const owner = await Owner.findOne({
          $or: [{ email: decodedOwner.email }, { phone: decodedOwner.phone }],
        }).select("-__v");

        if (owner) {
          req.owner = { data: owner, role: decodedOwner.role || "owner" };
          return next();
        }
      } catch (err) {
        console.warn("Owner token invalid:", err.message);
      }
    }

    return res.status(401).json({ message: "Invalid or expired token." });
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



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
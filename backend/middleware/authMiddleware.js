const jwt = require("jsonwebtoken");
const User = require("../models/user-model");
const Owner = require("../models/owner-model");

const userOrOwnerMiddleware = async (req, res, next) => {
  try {
    const { authToken } = req.cookies;

    if (!authToken) {
      return res.status(401).json({ message: "Unauthorized. Please log in." });
    }

    const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
    const id = decoded.id;

    // Check if user
    const user = await User.findById(id).select("-__v -password");
    if (user) {
      req.auth = { data: user, role: "user" };
      return next();
    }

    // Check if owner
    const owner = await Owner.findById(id).select("-__v -password");
    if (owner) {
      req.auth = { data: owner, role: "owner" };
      return next();
    }

    return res.status(401).json({ message: "Invalid token." });
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const adminMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.adminToken;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized! Token missing." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (
      decoded.email !== process.env.ADMIN_EMAIL ||
      decoded.password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({ message: "Unauthorized! Invalid credentials." });
    }

    next();
  } catch (error) {
    console.error("Admin Auth Error:", error.message);
    return res.status(401).json({ message: "Unauthorized! Invalid or expired token." });
  }
};

module.exports = {
  userOrOwnerMiddleware,
  adminMiddleware,
};

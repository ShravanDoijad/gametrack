const jwt = require('jsonwebtoken');
const Owner = require("../models/owner-model");

const ownerMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.authToken;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized. Please log in as owner." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const owner = await Owner.findOne({
      $or: [{ email: decoded.email }, { phone: decoded.phone }]
    }).select("-__v -password");

    if (!owner) {
      return res.status(401).json({ message: "Owner not found." });
    }

    req.auth = { data: owner, role: "owner" };
    next();

  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    console.error("Owner Auth Middleware Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  ownerMiddleware,
};

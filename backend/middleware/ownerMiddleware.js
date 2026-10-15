const jwt = require('jsonwebtoken');
const Owner = require("../models/owner-model");

const ownerMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.authToken;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized. Please log in as owner." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "owner" || !decoded.id) {
      return res.status(403).json({ message: "Owner access required." });
    }

    const owner = await Owner.findById(decoded.id).select("-__v -password");

    if (!owner) {
      return res.status(401).json({ message: "Owner not found." });
    }

    const requestedTurfId = req.query?.turfId || req.body?.turfId;
    if (requestedTurfId && !(owner.turfIds || []).some((id) => id.toString() === String(requestedTurfId))) {
      return res.status(403).json({ message: "This turf is not managed by your account." });
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

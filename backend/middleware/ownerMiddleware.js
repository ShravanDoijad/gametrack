const jwt = require('jsonwebtoken')
const Owner = require("../models/owner-model")

const ownerMiddleware = async(req, res, next) => {
  try {
    const token = req.cookies?.ownerToken;
    console.log("owner", token)
    if (!token) {
      return res.status(401).json({ message: "Unauthorized, Login First" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const owner = await Owner.findOne({ $or: [{ email: decoded.email }, { phone: decoded.phone }] }).select("-__v");
    if (!owner) return res.status(401).json({ success: false, message: "Owner not found" });
     req.owner = { data: owner, role: "owner" };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: " Please log in again." });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Please log in again." });
    }

    console.error("User Auth Middleware Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



module.exports = {
    ownerMiddleware,
    
}
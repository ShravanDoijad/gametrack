const User = require('../models/user-model');
const Owner = require('../models/owner-model');

const userAuthCheck = async (req, res) => {
  try {
    if (!req.user || !req.user.data) {
      return res.status(401).json({ success: false, message: "Unauthorized, user not found" });
    }

    const { data: user, role } = req.user;

    if (!user || !user.isVerified) {
      return res.status(401).json({ success: false, message: "Invalid or unverified user" });
    }

    const { _id, fullname, phone, email, favoriteTurfs, preferences } = user;
    res.status(200).json({
      success: true,
      isToken: true,
      role,
      user: { _id, fullname, phone, email, favoriteTurfs, preferences }
    });
  } catch (err) {
    console.log("User authentication error", err);
    res.status(500).json({ success: false, message: "Something went wrong", error: err.message });
  }
};


const ownerAuthCheck = async (req, res) => {
  try {
    if (!req.owner || !req.owner.data) {
      return res.status(401).json({ success: false, message: "Unauthorized, owner not found" });
    }

    const { data: owner, role } = req.owner;

    if (!owner || role !== "owner") {
      return res.status(401).json({ success: false, message: "Invalid or missing owner" });
    }

    const { _id, fullname, email, phone, turfname, turfId } = owner;
    res.status(200).json({
      success: true,
      isToken: true,
      role,
      owner: { _id, fullname, email, phone, turfname, turfId }
    });
  } catch (err) {
    console.log("Owner authentication error", err);
    res.status(500).json({ success: false, message: "Something went wrong", error: err.message });
  }
};



module.exports = { userAuthCheck, ownerAuthCheck };

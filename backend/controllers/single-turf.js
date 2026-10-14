// Single-turf mode.
// The whole app runs for ONE turf, whose id is set in backend/.env as TURF_ID.
const mongoose = require("mongoose");

const getTurfId = () => {
  const id = (process.env.TURF_ID || "").trim();
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
  return id;
};

// Call once at startup so a missing/invalid id is obvious in the logs.
const assertTurfIdConfigured = () => {
  if (!getTurfId()) {
    console.error(
      "❌ TURF_ID is missing or not a valid Mongo ObjectId. Set TURF_ID in backend/.env"
    );
    return false;
  }
  console.log(`🏟️  Single-turf mode: TURF_ID=${getTurfId()}`);
  return true;
};

// Pins every request to the configured turf, so no client can book / read /
// modify any other turf, whatever turfId it sends.
const forceSingleTurf = (req, res, next) => {
  const turfId = getTurfId();
  if (!turfId) {
    return res
      .status(500)
      .json({ success: false, message: "Server misconfigured: TURF_ID not set" });
  }

  if (req.query) {
    req.query.turfId = turfId;
    if (req.query.id !== undefined) req.query.id = turfId;
  }

  if (req.body && typeof req.body === "object") {
    if (req.body.turfId !== undefined) req.body.turfId = turfId;
    if (req.body.bookingDetails) req.body.bookingDetails.turfId = turfId;
    if (req.body.subscriptionDetails) req.body.subscriptionDetails.turfId = turfId;
  }
  next();
};

module.exports = { getTurfId, assertTurfIdConfigured, forceSingleTurf };
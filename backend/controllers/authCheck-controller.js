const authCheck = async (req, res) => {
  try {
    const auth = req.auth;
    if (!auth || !auth.data) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { data, role } = auth;

    if (role === "user") {
      if (!data.isVerified) {
        return res.status(401).json({ success: false, message: "User not verified" });
      }
      const { _id, fullname, phone, email, favoriteTurfs, preferences } = data;
      return res.status(200).json({
        success: true,
        isToken: true,
        role,
        user: { _id, fullname, phone, email, favoriteTurfs, preferences }
      });
    }

    if (role === "owner") {
      const { _id, fullname, email, phone, turfname, turfId } = data;
      return res.status(200).json({
        success: true,
        isToken: true,
        role,
        owner: { _id, fullname, email, phone, turfname, turfId }
      });
    }

    res.status(400).json({ success: false, message: "Invalid role" });
  } catch (err) {
    console.log("Auth check error", err);
    res.status(500).json({ success: false, message: "Something went wrong", error: err.message });
  }
};

module.exports = { authCheck };

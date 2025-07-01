const jwt = require("jsonwebtoken");
const Turf = require("../models/turf-model");
const cloudinary = require("../cloudinary");
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "all fields are required" });
    }

    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(400).json({ message: "invalid creds" });
    }

    const token = jwt.sign(
      {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    await res.cookie("adminToken", token);
    return res.status(200).json({ message: "admin loggedIn successfully" });
  } catch (error) {
    console.log("adminLogin error", error);

    res.status(500).json({ message: "internel server error" });
  }
};

const adminLogout = async (req, res) => {
  try {
    res.clearCookie("adminToken");
    res.status(200).json({ message: "admin logged out successfully" });
  } catch (error) {
    console.log("adminLogout error", error);

    res.status(500).json({ message: "internel server error" });
  }
};

const addTurf = async (req, res) => {
  try {
    const turfData = JSON.parse(req.body.turfData);
    const files = req.files
    console.log("turfData", files)
    const imageUrl =[]
    
    for (const file of files) {
        const b64 = Buffer.from(file.buffer).toString('base64')
        const dataUri = `data:${file.mimetype};base64,${b64}`;
        const result = await cloudinary.uploader.upload(dataUri,{
            folder: 'Turf_files'
        })
        imageUrl.push(result.secure_url)
    }

    
    if (!turfData) {
      return res.status(400).json({ message: "all fields are required" });
    }
    const turfWithImages = {
      ...turfData,
      images: imageUrl,
    };

    const newTurf = await Turf.create(turfWithImages);

    return res.status(201).json({
      success: true,
      message: "Turf added successfully.",
      turf: newTurf,
    });
  } catch (error) {
    console.error("Error while adding turf:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

module.exports = {
  adminLogin,
  adminLogout,
  addTurf,
};

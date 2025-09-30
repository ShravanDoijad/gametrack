const jwt = require("jsonwebtoken");
const Turf = require("../models/turf-model");
const Owner = require("../models/owner-model");
const User = require("../models/user-model");
const Booking = require("../models/booking-model");
const cloudinary = require("../cloudinary");
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "all fields are required" });
    }

    console.log(email , password)
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
      { expiresIn: "7d" }
    );
    await res.cookie("adminToken", token, {
      httpOnly: true,
      secure: true, // true in production (HTTPS)
      sameSite: "None",
      maxAge: 30 * 86400000 // 1 day
    });
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

const getAllTurfs = async (req, res) => {
  try {
    const turfs = await Turf.find({}).populate("owner", "name email");
    res.status(200).json(turfs);
  }
  catch (error) {
    console.log("Error fetching turfs:", error);
    res.status(500).json({ message: "Enable Load turfs", error: error });
  }
}

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.log("Error fetching users:", error);
    res.status(500).json({ message: "Enable Load users", error: error });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate("userId", "fullname email")
      .populate("turfId", "name location");
    res.status(200).json(bookings);
  } catch (error) {
    console.log("Error fetching bookings:", error);
    res.status(500).json({ message: "Enable Load bookings", error: error });
  }
};

const adminAuthCheck = async (req, res)=>{
  try{
    const token = req.cookies.adminToken;
    if(!token){
      return res.status(401).json({message: "Unauthorized! Token missing."})
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({message: "Authorized", admin: decoded})

  }
  catch(error){
    console.error("Admin Auth Error:", error.message);
    res.status(401).json({message: "Unauthorized! Invalid or expired token."})
  }
}
module.exports = {
  adminLogin,
  adminLogout,
  addTurf,
  getAllTurfs,
  getAllUsers,
  getAllBookings,
  adminAuthCheck
};

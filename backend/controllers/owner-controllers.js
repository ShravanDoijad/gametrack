const { sendOtp } = require("./otp-controller");
const { validationResult } = require('express-validator');
const Owner = require("../models/owner-model");
ownerLogin = async (req, res)=>{
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
    try {
        const { email, type} = req.body;
        console.log("Owner login request received:", { email, type });
        if (!email || !type) {
            return res.status(400).json({
                success: false,
                message: "Email and type are required",
            });
        }
        const existingOwner = await Owner.find({email})

        if(!existingOwner){
            return res.status(400).json({
                success: false,
                message: "Owner not found with this email",
            });
           
        }
        else{
           sendOtp({identifier: email, type: "email"});
            res.status(200).json({
                success: true,
                message: "OTP sent to your email",
            });
        }
    } catch (error) {
        console.error("Error during owner login:", error);
        res.status(500).json({ success: false, message: "Internal server error" });     
    }
}

module.exports = {
    ownerLogin,
};
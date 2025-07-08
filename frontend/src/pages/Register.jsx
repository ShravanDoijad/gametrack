import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookContext } from '../constexts/bookContext';
import { auth } from "../firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import axios from "axios";
import { toast} from 'react-toastify';
import { motion } from 'framer-motion';

const Register = () => {
  const { isLoading, setisLoading, fetchToken } = useContext(BookContext);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  // ✅ Send OTP
  const sendOtp = async () => {
    const phoneNumber = `+91${phone}`;

    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error("Please enter a valid 10-digit Indian number");
      return;
    }

    setisLoading(true);
    const toastId = toast.loading("Sending OTP...");

    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {},
        });
        await window.recaptchaVerifier.render();
      }

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        window.recaptchaVerifier
      );

      window.confirmationResult = confirmationResult;
      toast.success("OTP sent successfully!");
      setStep(2);
    } catch (err) {
      console.error("OTP sending error:", err);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      toast.dismiss(toastId);
      setisLoading(false);
    }
  };

  // ✅ Verify OTP
  const verifyOtp = async () => {
    setisLoading(true);
    const toastId = toast.loading("Verifying OTP...");

    try {
      const result = await window.confirmationResult.confirm(otp);
      const firebaseUser = result.user;
      const cleanPhone = firebaseUser.phoneNumber.replace("+91", "");

      const res = await axios.post("/api/users/login", {
        phone: cleanPhone,
      });

      if (res.data.success) {
        toast.success("Login successful! Redirecting...");
        fetchToken()
        setTimeout(() => navigate("/turfs"), 500);
      } else {
        toast.error("Login failed. Please try again.");
      }
    } catch (err) {
      console.error("OTP verification failed:", err);
      toast.error("Invalid OTP. Please check and try again.");
    } finally {
      toast.dismiss(toastId);
      setisLoading(false);
    }
  };

  // ✅ Google Login
  const googleLogin = async () => {
    setisLoading(true);
    const toastId = toast.loading("Signing in with Google...");

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await axios.post("/api/users/login", {
        email: user.email,
        name: user.displayName,
      });

      toast.success("Google login successful! Redirecting...");
      fetchToken()
      setTimeout(() => navigate("/turfs"), 500);
    } catch (err) {
      console.error("Google login error:", err);
      toast.error("Google sign-in failed. Please try again.");
    } finally {
      toast.dismiss(toastId);
      setisLoading(false);
    }
  };

  return (
    <div className="flex fixed  items-center justify-center min-h-screen z-40 px-4 poppins">
      
      
      <motion.div 
        className="w-full max-w-md p-8  rounded-3xl shadow-lg space-y-6 backdrop-blur-sm bg-white/90"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-1">Welcome Back</h2>
          <p className="text-gray-500">Login to continue to your account</p>
        </div>

        {/* ✅ Phone OTP UI */}
        <div className="space-y-4">
          {step === 1 ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-500">+91</span>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="border border-gray-200 rounded-xl p-3 w-full pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>
              <button
                onClick={sendOtp}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3 rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Send OTP'}
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="border border-gray-200 rounded-xl p-3 w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-center tracking-widest"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition"
                >
                  Back
                </button>
                <button
                  onClick={verifyOtp}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold py-3 rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-white text-gray-400 text-sm">or continue with</span>
          </div>
        </div>

        {/* ✅ Google Sign-In Button */}
        <button
          onClick={googleLogin}
          disabled={isLoading}
          className="w-full border border-gray-200 hover:border-gray-300 bg-white text-gray-700 font-medium py-3 rounded-xl transition flex items-center justify-center gap-3 shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="google"
            className="w-5 h-5"
          />
          Sign in with Google
        </button>

        <div className="text-center text-sm text-gray-500">
          By continuing, you agree to our Terms and Privacy Policy
        </div>

        <div id="recaptcha-container" />
      </motion.div>
    </div>
  );
};

export default Register;
import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X } from 'lucide-react';

const OwnerLogin = ({ setShowLoginPopup }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    try {
      const response = await axios.post('/owner/ownerLogin', {
        email,
        type: 'email',
      });
      if (response.data.success) {
        navigate('/otp', { state: { identifier: email, type: 'email' } });
        setError('');
      } else {
        setError(response.data.message || 'Something went wrong');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
      console.error('Error sending OTP:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key="login"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl relative"
        >
          {/* ❌ Close Button */}
          <button
            onClick={() => setShowLoginPopup(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition"
          >
            <X size={20} />
          </button>

          <h2 className="text-2xl font-bold text-gray-800 mb-4">Owner Login</h2>
          <p className="text-sm text-gray-500 mb-4">Enter your registered email to get started</p>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600">Email</label>
            <div className="flex items-center mt-1 bg-gray-100 rounded-lg px-3 py-2">
              <Mail className="w-4 h-4 mr-2 text-gray-500" />
              <input
                type="email"
                className="bg-transparent w-full focus:outline-none"
                placeholder="owner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

          <button
            onClick={handleSendOtp}
            className="w-full bg-lime-500 text-black font-semibold py-2 rounded-xl hover:scale-[1.02] transition"
          >
            Send OTP
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default OwnerLogin;

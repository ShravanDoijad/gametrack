import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { BookContext } from '../constexts/bookContext';
import axios from 'axios';

const OtpVerify = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setloginPanel, token } = useContext(BookContext);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError('Enter a valid 6-digit OTP');
      return;
    }

    try {
      const response = await axios.post(`/otp/verifyOtp`, {
        identifier: location.state.identifier,
        type: location.state.type,
        otp: otp,
      });

      if (response.data.success) {
        alert('OTP verified successfully');
        setOtp("")
        navigate("/turfs")
        setloginPanel(false)
      } else {
        setError(response.data.message || 'Invalid OTP, please try again');
        setloginPanel(true)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    }
  };



  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 z-50">
      <div className="bg-white w-full max-w-sm rounded-2xl px-6 py-8 shadow-xl">
        <h2 className="text-2xl font-bold text-center text-gray-800">Verify OTP</h2>
        <p className="text-sm text-center text-gray-500 mt-2 mb-6">
          Sent to <span className="font-medium text-gray-700">{location.state.identifier}</span>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            maxLength={6}
            inputMode="numeric"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="w-full px-4 py-3 text-xl text-center border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 tracking-widest"
          />

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            className="bg-yellow-500 hover:bg-yellow-600 transition-all text-black font-semibold py-2 rounded-xl"
          >
            Verify & Continue
          </button>
        </form>

        <p
          onClick={() => navigate(-1)}
          className="text-sm text-center mt-4 text-blue-500 cursor-pointer hover:underline"
        >
          Wrong number or email? Go back
        </p>
      </div>
    </div>
  );
};

export default OtpVerify;

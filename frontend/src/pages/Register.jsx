import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { BookContext } from '../constexts/bookContext';
import { Phone, Mail, Lock, X, UserPlus, LogIn, ArrowLeft, MessageCircle, User, ChevronRight } from 'lucide-react';

const Register = () => {
  const { settoken, userInfo, setloginPanel, fetchToken } = useContext(BookContext);
  const [isLoading, setisLoading] = useState(false)
  console.log("userInfo in register:", userInfo);
  const [form, setForm] = useState({ 
    firstName: '', 
    lastName: '', 
    phone: '', 
    email: '', 
    otp: '' 
  });
  const [activeTab, setActiveTab] = useState('phone');
  const [isOwnerLogin, setIsOwnerLogin] = useState(false);
  const panelRef = useRef();
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.3 } }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Phone number validation (only numbers and max 10 digits)
    if (name === 'phone') {
      const phoneValue = value.replace(/\D/g, '').slice(0, 10);
      setForm({ ...form, [name]: phoneValue });
      return;
    }
    
    // OTP validation (only numbers and max 6 digits)
    if (name === 'otp') {
      const otpValue = value.replace(/\D/g, '').slice(0, 6);
      setForm({ ...form, [name]: otpValue });
      return;
    }
    
    // Name validation (only letters and spaces)
    if (name === 'firstName' || name === 'lastName') {
      const nameValue = value.replace(/[^a-zA-Z\s]/g, '');
      setForm({ ...form, [name]: nameValue });
      return;
    }
    
    setForm({ ...form, [name]: value });
  };

  const sendOtp = async () => {
    try {
      if (!isOwnerLogin &&( !form.phone || form.phone.length !== 10)) {
        return toast.error('Please enter a valid 10-digit mobile number');
      }
      if (isOwnerLogin && !form.email) {
        return toast.error('Please enter a valid email address');
      }

      setisLoading(true);
      const res = await axios.post('/api/users/login', { identifier: form.phone || form.email });
      
      if (res.data.success) {
        toast.success('OTP sent to your mobile number');
        setActiveTab('otp');
      } else {
        toast.error(res.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      if(err.response?.status === 401) {
        toast.error('Account not found. Please register first.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to send OTP');
      }
    } finally {
      setisLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setisLoading(true);
      if (!form.otp || form.otp.length !== 6) {
        return toast.error('Please enter a valid 6-digit OTP');
      }
      
      const res = await axios.post('/otp/verifyOtp', { 
        identifier: form.phone || form.email, 
        otp: form.otp 
      });
      
      if (res.data.success) {
        toast.success('Login Successful!');
        
        console.log("res_data:", res.data);
        if (!isOwnerLogin && (res.data.user=="" || res.data.user=="Guest" || res.data.user=='guest')) {
          setActiveTab('profile');
        } else {
          fetchToken();
          setTimeout(() => navigate('/'), 500);
        }
      } else {
        toast.error(res.data.message || 'Verification failed');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Server error');
    } finally {
      setisLoading(false);
    }
  };

  const handleProfileComplete = async () => {
    try {
      if (!form.firstName || !form.lastName) {
        return toast.error('Please enter your full name');
      }
      
      setisLoading(true);
      const res = await axios.post('/api/users/complete-profile', {
       
        firstName: form.firstName,
        lastName: form.lastName
      });
      
      if (res.data.success) {
        fetchToken();
        setTimeout(() => navigate('/'), 500);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setisLoading(false);
    }
  };

  const renderPhoneTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Mobile Number
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">+91</span>
                <div className="h-5 w-px bg-gray-300"></div>
              </div>
            </div>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter 10-digit mobile number"
              maxLength="10"
              className="w-full pl-20 pr-4 py-4 rounded-lg border border-gray-300 
                       focus:border-orange-500 focus:ring-2 focus:ring-orange-200 
                       transition-all text-lg tracking-wider
                       hover:border-gray-400"
              style={{ 
                borderRadius: '8px',
                borderWidth: '1px',
                fontSize: '16px'
              }}
            />
            {form.phone.length === 10 && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
            )}
          </div>
          {form.phone.length > 0 && form.phone.length < 10 && (
            <p className="text-red-500 text-xs mt-1">Enter a valid 10-digit mobile number</p>
          )}
        </div>

        <p className="text-xs text-gray-500 px-1">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>

        <button
          onClick={sendOtp}
          disabled={form.phone.length !== 10 || isLoading}
          className={`w-full py-4 px-4 rounded-lg font-medium text-white transition-all
                    ${form.phone.length === 10 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg' 
                      : 'bg-gray-300 cursor-not-allowed'}`}
          style={{ borderRadius: '8px' }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Sending OTP...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              Continue
              <ChevronRight className="ml-1" size={18} />
            </span>
          )}
        </button>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        <button
          onClick={() => {
            setIsOwnerLogin(true);
            setActiveTab('owner');
          }}
          className="w-full py-4 px-4 rounded-lg border-2 border-gray-300 
                   font-medium text-gray-700 hover:bg-gray-50 transition-all
                   flex items-center justify-center gap-2"
          style={{ borderRadius: '8px' }}
        >
          <Mail size={18} />
          Login as Turf Owner (Email)
        </button>
      </div>
    </div>
  );

  const renderOwnerTab = () => (
    <div className="space-y-6">
      <button
        onClick={() => {
          setIsOwnerLogin(false);
          setActiveTab('phone');
        }}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2 transition-colors"
      >
        <ArrowLeft size={18} /> Back
      </button>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Email Address
        </label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="owner@example.com"
          className="w-full px-4 py-4 rounded-lg border border-gray-300 
                   focus:border-orange-500 focus:ring-2 focus:ring-orange-200 
                   transition-all text-base
                   hover:border-gray-400"
          style={{ borderRadius: '8px' }}
        />
      </div>

      <button
        onClick={sendOtp}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 
                 text-white py-4 px-4 rounded-lg font-medium 
                 hover:shadow-lg transition-all"
        style={{ borderRadius: '8px' }}
      >
        Continue
      </button>
    </div>
  );

  const renderOtpTab = () => (
    <div className="space-y-6">
      <button
        onClick={() => setActiveTab('phone')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2 transition-colors"
      >
        <ArrowLeft size={18} /> Back
      </button>

      <div className="flex flex-col items-center justify-center gap-4 mb-6">
        <div className="p-4 bg-orange-100 rounded-full text-orange-600">
          <Lock size={28} />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-1">Enter OTP</h3>
          <p className="text-gray-600 text-sm">
            Sent to +91 {form.phone}
          </p>
        </div>
        
        <div className="w-full p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <MessageCircle size={20} className="text-green-600 mt-0.5" />
            <div>
              <p className="text-green-700 font-medium text-sm">OTP sent via WhatsApp</p>
              <p className="text-green-600 text-xs mt-1">
                Check your WhatsApp messages for the 6-digit verification code
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Enter 6-digit OTP
        </label>
        <input
          type="text"
          name="otp"
          value={form.otp}
          onChange={handleChange}
          placeholder="• • • • • •"
          maxLength="6"
          className="w-full px-4 py-4 rounded-lg border border-gray-300 
                   focus:border-orange-500 focus:ring-2 focus:ring-orange-200 
                   transition-all text-center text-2xl tracking-widest font-mono
                   hover:border-gray-400"
          style={{ borderRadius: '8px', letterSpacing: '8px' }}
        />
        {form.otp.length > 0 && form.otp.length < 6 && (
          <p className="text-red-500 text-xs mt-1">Enter complete 6-digit OTP</p>
        )}
      </div>

      <button
        onClick={handleVerify}
        disabled={form.otp.length !== 6 || isLoading}
        className={`w-full py-4 px-4 rounded-lg font-medium text-white transition-all
                  ${form.otp.length === 6 
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg' 
                    : 'bg-gray-300 cursor-not-allowed'}`}
        style={{ borderRadius: '8px' }}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Verifying...
          </span>
        ) : (
          'Verify OTP'
        )}
      </button>

      <div className="text-center pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Didn't receive OTP?{' '}
          <button
            onClick={sendOtp}
            className="text-orange-600 font-medium hover:underline focus:outline-none"
          >
            Resend OTP
          </button>
        </p>
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center gap-4 mb-6">
        <div className="p-4 bg-blue-100 rounded-full text-blue-600">
          <User size={28} />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-1">Complete Your Profile</h3>
          <p className="text-gray-600 text-sm">
            Please enter your name to continue
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">First Name</label>
          <input
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            placeholder="John"
            className="w-full px-4 py-4 rounded-lg border border-gray-300 
                     focus:border-orange-500 focus:ring-2 focus:ring-orange-200 
                     transition-all text-base
                     hover:border-gray-400"
            style={{ borderRadius: '8px' }}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            placeholder="Doe"
            className="w-full px-4 py-4 rounded-lg border border-gray-300 
                     focus:border-orange-500 focus:ring-2 focus:ring-orange-200 
                     transition-all text-base
                     hover:border-gray-400"
            style={{ borderRadius: '8px' }}
          />
        </div>
      </div>

      <button
        onClick={handleProfileComplete}
        disabled={!form.firstName || !form.lastName || isLoading}
        className={`w-full py-4 px-4 rounded-lg font-medium text-white transition-all
                  ${form.firstName && form.lastName
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg' 
                    : 'bg-gray-300 cursor-not-allowed'}`}
        style={{ borderRadius: '8px' }}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Saving...
          </span>
        ) : (
          'Continue'
        )}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br fixed inset-0 from-gray-50 to-gray-100 flex flex-col">
      <div className="container mx-auto px-4 py-6 flex-1 flex flex-col">
        <button
          onClick={() => {
            setloginPanel(false);
            navigate('/');
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 self-start transition-colors"
        >
          <ArrowLeft size={18} /> Back to home
        </button>

        <div className="flex-1 flex justify-center items-center">
          <motion.div
            ref={panelRef}
            className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            style={{ 
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {activeTab === 'phone' && 'Welcome'}
                  {activeTab === 'otp' && 'Verify OTP'}
                  {activeTab === 'owner' && 'Owner Login'}
                  {activeTab === 'profile' && 'Complete Profile'}
                </h2>
                <p className="text-gray-500">
                  {activeTab === 'phone' && 'Sign in to continue'}
                  {activeTab === 'otp' && 'Enter the verification code'}
                  {activeTab === 'owner' && 'Login with your turf owner email'}
                  {activeTab === 'profile' && 'Almost there! Just need your name'}
                </p>
              </div>

              <div className="space-y-6">
                {activeTab === 'phone' && renderPhoneTab()}
                {activeTab === 'owner' && renderOwnerTab()}
                {activeTab === 'otp' && renderOtpTab()}
                {activeTab === 'profile' && renderProfileTab()}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Register;
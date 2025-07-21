import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { BookContext } from '../constexts/bookContext';
import { Phone, Mail, Lock, X, UserPlus, LogIn, ArrowLeft } from 'lucide-react';

const Register = () => {
  const {  settoken, setloginPanel, fetchToken } = useContext(BookContext);
  const [isLoading, setisLoading] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', otp: '' });
  const [activeTab, setActiveTab] = useState('credentials');
  const [isLogin, setIsLogin] = useState(false);
  const [loginTab, setLoginTab] = useState('phone');
  const panelRef = useRef();
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.3 } }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const sendOtp = async () => {
    try {
      setisLoading(true);
      if (isLogin) {
        const identifier = loginTab === 'phone' ? form.phone : form.email;
        if (!identifier) return toast.error(`${loginTab === 'phone' ? 'Phone number' : 'Email'} is required`);
        const res = await axios.post('/api/users/login', { identifier });
        if (res.data.success) {
          toast.success('OTP sent');
          setActiveTab('otp');

        } else toast.error(res.data.message || 'Failed to send OTP');
      } else {
        const { firstName, lastName, phone } = form;
        if (!firstName || !lastName || !phone) return toast.error('All fields are required');
        const res = await axios.post('/api/users/userRegister', { firstName, lastName, phone });
        if (res.data.success) {
          toast.success('OTP sent');
          setActiveTab('otp');
        } else toast.error(res.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to send OTP');
    } finally {
      setisLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setisLoading(true);
      const { phone, email, otp } = form;
      if ((!phone && !email) || !otp) return toast.error('Phone/email and OTP are required');
      const identifier = phone || email;
      const res = await axios.post('/otp/verifyOtp', { identifier, otp });
      if (res.data.success) {
        toast.success('Login Successful!');
        fetchToken()
        setTimeout(() => navigate('/'), 500);
      } else toast.error(res.data.message || 'Verification failed');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Server error');
    } finally {
      setisLoading(false);
    }
  };

  const renderCredentialsTab = () => (
    <div className="space-y-6">
      {!isLogin && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">First Name</label>
            <input 
              type="text" 
              name="firstName" 
              value={form.firstName} 
              onChange={handleChange} 
              placeholder="John" 
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      )}

      {isLogin && (
        <div className="flex space-x-2 mb-2 bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setLoginTab('phone')} 
            className={`flex items-center justify-center gap-2 flex-1 py-2 px-4 rounded-md transition-all ${loginTab === 'phone' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'}`}
          >
            <Phone size={16} /> Phone
          </button>
          <button 
            onClick={() => setLoginTab('email')} 
            className={`flex items-center justify-center gap-2 flex-1 py-2 px-4 rounded-md transition-all ${loginTab === 'email' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'}`}
          >
            <Mail size={16} /> Email
          </button>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          {(!isLogin || loginTab === 'phone') ? 'Phone Number' : 'Email Address'}
        </label>
        {(!isLogin || loginTab === 'phone') ? (
          <input 
            type="tel" 
            name="phone" 
            value={form.phone} 
            onChange={handleChange} 
            placeholder="+91 9876543210" 
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        ) : (
          <input 
            type="email" 
            name="email" 
            value={form.email} 
            onChange={handleChange} 
            placeholder="your@email.com" 
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        )}
      </div>

      <button 
        onClick={sendOtp} 
        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-md transition-all transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        Send OTP
      </button>

      <div className="text-center pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          {isLogin ? (
            <>Don't have an account?{' '}
              <button 
                onClick={() => { setIsLogin(false); setActiveTab('credentials'); }} 
                className="text-blue-600 font-medium hover:underline focus:outline-none"
              >
                Register
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button 
                onClick={() => { setIsLogin(true); setActiveTab('credentials'); }} 
                className="text-blue-600 font-medium hover:underline focus:outline-none"
              >
                Login
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );

  const renderOtpTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center gap-2 mb-4">
        <div className="p-3 bg-blue-100 rounded-full text-blue-600">
          <Lock size={24} />
        </div>
        <h3 className="text-xl font-semibold text-gray-800">Enter OTP</h3>
        <p className="text-sm text-gray-500">
          Code sent to {loginTab === 'phone' ? form.phone : form.email}
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Verification Code</label>
        <input 
          type="text" 
          name="otp" 
          value={form.otp} 
          onChange={handleChange} 
          placeholder="Enter 6-digit OTP" 
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center tracking-widest font-mono"
        />
      </div>

      <div className="flex gap-3">
        <button 
          onClick={() =>setloginPanel(false)} 
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button 
          onClick={handleVerify} 
          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-md transition-all"
        >
          {isLogin ? 'Login' : 'Register'}
        </button>
      </div>

      <div className="text-center pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Didn't receive code?{' '}
          <button 
            onClick={sendOtp} 
            className="text-blue-600 font-medium hover:underline focus:outline-none"
          >
            Resend OTP
          </button>
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br fixed  from-gray-50 to-gray-100 flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        <button
          onClick={() => setloginPanel(false)|| navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 self-start transition-colors"
        >
          <ArrowLeft size={18} /> Back to home
        </button>

        <div className="flex-1 flex items-center justify-center">
          <motion.div
            ref={panelRef}
            className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
          >
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-3">
                  {isLogin ? (
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      <LogIn size={24} />
                    </div>
                  ) : (
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      <UserPlus size={24} />
                    </div>
                  )}
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-gray-500 mt-2">
                  {activeTab === 'credentials' ? 
                    (isLogin ? 'Sign in to continue to your account' : 'Get started with your account') : 
                    'Enter the verification code we sent you'}
                </p>
              </div>
              
              <div className="space-y-6">
                {activeTab === 'credentials' ? renderCredentialsTab() : renderOtpTab()}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Register;
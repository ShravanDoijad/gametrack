import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { BookContext } from '../constexts/bookContext';
import { Phone, Mail, Lock } from 'lucide-react';

const Register = () => {
  const { setisLoading, settoken } = useContext(BookContext);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', otp: '' });
  const [activeTab, setActiveTab] = useState('credentials');
  const [isLogin, setIsLogin] = useState(false);
  const [loginTab, setLoginTab] = useState('phone');
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const sendOtp = async () => {
    try {
      setisLoading(true);

      if (isLogin) {
        const identifier = loginTab === 'phone' ? form.phone : form.email;
        if (!identifier) return toast.error(`${loginTab === 'phone' ? 'Phone number' : 'Email'} is required`);
        const res = await axios.post('/api/users/login', loginTab === 'phone' ? { identifier: form.phone } : { identifier: form.email });
        console.log("login Res", res.data)
        if (res.data.success) {
          toast.success('OTP sent');
          setActiveTab('otp');
        } else {
          toast.error(res.data.message || 'Failed to send OTP');
        }
      } else {
        const { firstName, lastName, phone } = form;
        if (!firstName || !lastName || !phone) return toast.error('All fields are required');
        const res = await axios.post('/api/users/userRegister', { firstName, lastName, phone });
        if (res.data.success) {
          toast.success('OTP sent');
          setActiveTab('otp');
        } else {
          toast.error(res.data.message || 'Failed to send OTP');
        }
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

        if ((!phone && !email)|| !otp) return toast.error('phone or email *and* OTP are required');
        const identifier = phone || email;
        const res = await axios.post('/otp/verifyOtp', { identifier, otp });
        if (res.data.success) {
          toast.success('Registration successful!');
          settoken(true)
          setTimeout(() => navigate('/turfs'), 500);
        } else {
          toast.error(res.data.message || 'Registration failed');
        }
      }
     catch (err) {
      console.error(err);
      toast.error(err.response.data.message ||'Server error');
    } finally {
      setisLoading(false);
    }
  };
  const renderCredentialsTab = () => (
    <div className="space-y-4 ">
      {!isLogin && (
        <>
          <input
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            placeholder="First Name"
            className="border border-gray-200 rounded-xl p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            placeholder="Last Name"
            className="border border-gray-200 rounded-xl p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </>
      )}

      {isLogin && (
        <div className="flex space-x-2 mb-2">
          <button
            onClick={() => setLoginTab('phone')}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium border ${loginTab === 'phone' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 border-gray-300'}`}
          >
            <Phone size={16} /> Phone
          </button>
          <button
            onClick={() => setLoginTab('email')}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium border ${loginTab === 'email' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 border-gray-300'}`}
          >
            <Mail size={16} /> Email
          </button>
        </div>
      )}

      {(!isLogin || loginTab === 'phone') && (
        <input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Phone Number"
          className="border border-gray-200 rounded-xl p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}

      {isLogin && loginTab === 'email' && (
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          className="border border-gray-200 rounded-xl p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}

      <button
        onClick={sendOtp}
        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl transition hover:bg-blue-700"
      >
        Send OTP
      </button>

      <p className="text-center text-sm text-gray-500">
        {isLogin ? (
          <>Don't have an account?{' '}
          <button onClick={() => { setIsLogin(false); setActiveTab('credentials'); }} className="text-blue-600 font-medium hover:underline">Register here</button></>
        ) : (
          <>Already have an account?{' '}
          <button onClick={() => { setIsLogin(true); setActiveTab('credentials'); }} className="text-blue-600 font-medium hover:underline">Login here</button></>
        )}
      </p>
    </div>
  );

  const renderOtpTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Lock size={24} className="text-blue-500" />
        <h3 className="text-xl font-semibold">Enter OTP</h3>
      </div>
      
      <p className="text-center text-gray-500 mb-4">
        We've sent a 6-digit code to {loginTab === 'phone' ? form.phone : form.email}
      </p>

      <input
        type="text"
        name="otp"
        value={form.otp}
        onChange={handleChange}
        placeholder="Enter OTP"
        className="border border-gray-200 rounded-xl p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="flex space-x-3">
        <button
          onClick={() => setActiveTab('credentials')}
          className="flex-1 bg-gray-200 text-gray-800 font-semibold py-3 rounded-xl transition hover:bg-gray-300"
        >
          Back
        </button>
        <button
          onClick={handleVerify}
          className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl transition hover:bg-blue-700"
        >
          {isLogin ? 'Login' : 'Register'}
        </button>
      </div>

      <p className="text-center text-sm text-gray-500">
        Didn't receive code?{' '}
        <button onClick={sendOtp} className="text-blue-600 font-medium hover:underline">Resend OTP</button>
      </p>
    </div>
  );

  return (
    <div className="flex fixed items-center top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 justify-center min-h-screen z-40 px-4 poppins">
      <motion.div
        className="w-full max-w-md p-8 rounded-3xl shadow-lg space-y-6 backdrop-blur-sm bg-white/90"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-1">
            {isLogin ? 'Login' : 'Create Your Account'}
          </h2>
          <p className="text-gray-500">
            {isLogin 
              ? activeTab === 'credentials' ? 'Login to continue' : 'Verify your account'
              : activeTab === 'credentials' ? 'Register to get started' : 'Verify your account'}
          </p>
        </div>

        {activeTab === 'credentials' ? renderCredentialsTab() : renderOtpTab()}
      </motion.div>
    </div>
  );
};

export default Register;
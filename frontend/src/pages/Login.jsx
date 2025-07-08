import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { BookContext } from '../constexts/bookContext';

const Login = () => {
  const { setisLoading, fetchToken } = useContext(BookContext);
  const [form, setForm] = useState({ phone: '', email: '', password: '' });
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

  const handleLogin = async () => {
    const { phone, email, password } = form;

    if ((!phone && !email) || !password) {
      return toast.error('Phone or Email and Password are required');
    }

    setisLoading(true);
    const toastId = toast.loading('Logging in...');

    try {
      const res = await axios.post('/api/users/login', form);

      if (res.data.success) {
        toast.success('Login successful! Redirecting...');
        fetchToken();
        setTimeout(() => navigate('/turfs'), 500);
      } else {
        toast.error(res.data.message || 'Login failed.');
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error(err?.response?.data?.message || 'Something went wrong.');
    } finally {
      toast.dismiss(toastId);
      setisLoading(false);
    }
  };

  return (
    <div className="flex fixed items-center justify-center min-h-screen z-40 px-4 poppins">
      <motion.div
        className="w-full max-w-md p-8 rounded-3xl shadow-lg space-y-6 backdrop-blur-sm bg-white/90"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-1">Welcome Back</h2>
          <p className="text-gray-500">Login to continue to your account</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="9876543210"
              className="border border-gray-200 rounded-xl p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div className="text-center text-sm text-gray-500">or</div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="border border-gray-200 rounded-xl p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="border border-gray-200 rounded-xl p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3 rounded-xl transition shadow-md hover:shadow-lg"
          >
            Login
          </button>
        </div>

        <p className="text-center text-sm text-gray-500">
          Don’t have an account?{' '}
          <Link to="/register" className="text-blue-600 font-medium hover:underline">
            Register here
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;

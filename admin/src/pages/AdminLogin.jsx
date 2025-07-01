import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import axios from 'axios'

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin =async (e) => {
    e.preventDefault();
    const response=  await axios.post("/admin/adminLogin", {email, password})
    if(response.status.success){
        console.log(response.data)
        alert("admin logged In")
    }
    else{
        console.log(response.data);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Admin Panel Login</h2>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-600">Email</label>
            <div className="flex items-center mt-1 bg-gray-100 rounded-lg px-3 py-2">
              <Mail className="w-4 h-4 mr-2 text-gray-500" />
              <input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent w-full focus:outline-none text-gray-700"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Password</label>
            <div className="flex items-center mt-1 bg-gray-100 rounded-lg px-3 py-2">
              <Lock className="w-4 h-4 mr-2 text-gray-500" />
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent w-full focus:outline-none text-gray-700"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-xl font-semibold hover:bg-gray-900 transition duration-200"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;

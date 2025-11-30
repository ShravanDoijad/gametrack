import React from 'react';
import { Link } from 'react-router-dom';

export const Error403 = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-sora p-4 text-center">
      <h1 className="text-6xl font-bold mb-4">403</h1>
      <p className="text-xl md:text-2xl mb-6">Access Denied. You don’t have permission to view this page.</p>
      <Link to="/" className="bg-white text-black px-6 py-2 rounded-2xl font-semibold hover:bg-gray-300 transition-all">
        Return Home
      </Link>
    </div>
  );
};

export default Error403;
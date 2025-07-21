import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Calendar,
  ArrowUpDown,
  Loader2,
  AlertCircle,
  Zap
} from 'lucide-react';
import { BookContext } from "../constexts/bookContext";

const Bookings = () => {
  const { bookings, setbookings} = useContext(BookContext);
  console.log("Bookings data:", bookings);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const filteredBookings = bookings.filter(booking => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'advance') return booking.paymentType === 'advance';
    if (activeFilter === 'confirmed') return booking.status === 'confirmed';
    if (activeFilter === 'upcoming') return new Date(booking.date) >= new Date();
    if (activeFilter === 'past') return new Date(booking.date) < new Date();
    return true;
  });

  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };


  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 max-w-xs text-center shadow-2xl">
          <AlertCircle className="mx-auto h-12 w-12 text-rose-400 mb-3" />
          <p className="text-rose-300 font-sora font-medium mb-1">Data Error</p>
          <p className="text-gray-400 font-sora text-sm">{error}</p>
          <button className="mt-4 px-4 py-2 bg-rose-900/50 text-rose-300 rounded-lg border border-rose-800 text-sm font-sora hover:bg-rose-800/30 transition">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black px-4 sm:px-6 py-6 overflow-auto">
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-lime-500 font-sora">
              Booking Command Center
            </h1>
            <p className="text-gray-500 text-sm mt-1 font-sora">Turf management dashboard</p>
          </div>
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 border border-gray-800">
            <div className="flex items-center space-x-2 text-lime-300">
              <Calendar size={18} />
              <span className="font-sora font-medium text-sm">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2 items-center">
          {['all', 'upcoming', 'confirmed', 'advance', 'past'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-sora font-medium transition-all ${
                activeFilter === filter 
                  ? 'bg-lime-500 text-gray-900' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          
          ))}
        <Link className='text-sm ml-2 text-blue-500 hover:underline' to={'/owner/turfTodaysbookings'} >today's Bookings</Link>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className={`px-4 py-2 rounded-lg text-sm font-sora font-medium flex items-center ml-auto ${
              'bg-gray-800 text-lime-300'
            }`}
          >
            <ArrowUpDown className="mr-2" size={16} />
            {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-400 border border-gray-800">
            <thead className="bg-gray-900 text-gray-300">
              <tr>
                <th className="px-4 py-2 border-b border-gray-800">Date</th>
                <th className="px-4 py-2 border-b border-gray-800">Slots</th>
                <th className="px-4 py-2 border-b border-gray-800">Advance</th>
                <th className="px-4 py-2 border-b border-gray-800">On-Field</th>
                <th className="px-4 py-2 border-b border-gray-800">Status</th>
                <th className="px-4 py-2 border-b border-gray-800">User</th>
              </tr>
            </thead>
            <tbody>
              {sortedBookings.map((booking) => {
                const advance = booking.paymentType === 'advance' ? booking.amountPaid : 0;

                let estimatedAmount = 0;
                if (booking.paymentType === 'advance' && booking.slots?.length > 0) {
                  let totalHours = 0;
                  booking.slots.forEach(slot => {
                    const start = parseInt(slot.start.split(":"[0]));
                    const end = parseInt(slot.end.split(":"[0]));
                    totalHours += (end - start);
                  });
                  const rate = booking.slotFees;
                  estimatedAmount = totalHours * rate - advance;
                }

                return (
                  <tr key={booking._id} className="bg-gray-800/40 border-b border-gray-700 hover:bg-gray-800/60">
                    <td className="px-4 py-2 font-medium text-white">{formatDate(booking.date)}</td>
                    <td className="px-4 py-2">{booking.slots.length} slot(s)</td>
                    <td className="px-4 py-2 text-amber-400">₹{advance}</td>
                    <td className="px-4 py-2 text-green-400">₹{estimatedAmount}</td>
                    <td className="px-4 py-2 capitalize">{booking.status}</td>
                    <td className="px-4 py-2 text-white">{booking.userId?.email || booking.userId?.phone}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500 font-sora">
          Showing <span className="font-medium text-lime-300">{filteredBookings.length}</span> of <span className="font-medium text-white">{bookings.length}</span> bookings
        </div>
      </div>
    </div>
  );
};

export default Bookings;

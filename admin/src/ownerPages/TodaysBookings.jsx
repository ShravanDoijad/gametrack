import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { parse, format, isToday, parseISO } from 'date-fns';
import { useContext } from 'react';
import { BookContext } from '../constexts/bookContext';
const TodaysBookings = () => {
  const {bookings, setbookings} = useContext(BookContext)
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState(null);
  const [todayBookings, setTodayBookings] = useState([]);

  useEffect(() => {
    if (bookings.length > 0) {
      const filtered = bookings.filter((booking) => isToday(parseISO(booking.date)));
      setTodayBookings(filtered); 
    }
    setLoading(false); 
  }, [bookings]);
  const formatTime = (timeString) => {
    if (!timeString) return "Invalid time";
    try {
      const parsed = parse(timeString, 'HH:mm', new Date());
      return format(parsed, 'hh:mm a');
    } catch (err) {
      return "Invalid time";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-white text-lg">Loading today's bookings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen  text-white py-10 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">📅 Today's Bookings</h1>

      {todayBookings.length === 0 ? (
        <div className="text-center text-gray-400">No bookings today</div>
      ) : (
        <div className="space-y-4 max-w-4xl mx-auto">
          {todayBookings.map((booking) => {
            const isExpanded = expandedCard === booking._id;
            return (
              <div
                key={booking._id}
                onClick={() => setExpandedCard(isExpanded ? null : booking._id)}
                className={`border border-cyan-600/60 bg-gray-800/30 rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-200 ${isExpanded ? 'ring-2 ring-cyan-500' : ''}`}
              >
                <div className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-cyan-400 font-semibold">{format(parseISO(booking.date), 'PP')}</p>
                    <p className="text-gray-200 text-sm">{booking.slots.map(slot => `${formatTime(slot.start)} - ${formatTime(slot.end)}`).join(', ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold text-lg">₹{booking.amountPaid}</p>
                    <p className="text-sm text-gray-400">{booking.userId?.fullname || booking.fullname}</p>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-700 p-4 space-y-3 bg-black/40">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400">User Email</p>
                        <p className="text-white text-sm">{booking.userId?.email|| "Not a Email"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Phone Number</p>
                        <p className="text-white text-sm">{booking.userId?.phone|| booking.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Payment ID</p>
                        <p className="text-white text-sm font-mono">{booking.razorpay_payment_id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Status</p>
                        <p className={`text-sm ${booking.status === 'confirmed' ? 'text-green-400' : 'text-yellow-400'}`}>{booking.status}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TodaysBookings;
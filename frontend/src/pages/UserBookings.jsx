import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { parse, format, isToday, isPast, parseISO, getHours } from 'date-fns';

const UserBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [expandedCard, setExpandedCard] = useState(null);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const response = await axios.get('/api/users/allBookings');
                setBookings(response.data.allBookings);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching bookings:', error);
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const categorizeBookings = () => {
        const now = new Date();
        const currentHour = getHours(now);
        const currentMinutes = now.getMinutes();

        return bookings.reduce((acc, booking) => {
            const bookingDate = parseISO(booking.date);
            const isPastDate = isPast(bookingDate) && !isToday(bookingDate);
            const isTodayBooking = isToday(bookingDate);
            const slots = booking.slots || [];

            const hasUpcomingSlots = slots.some(slot => {
                const slotTime = parse(slot.start, 'hh:mm a', new Date());
                return slotTime.getHours() > currentHour ||
                    (slotTime.getHours() === currentHour && slotTime.getMinutes() > currentMinutes);
            });

            const hasPastSlots = slots.every(slot => {
                const slotTime = parse(slot.start, 'hh:mm a', new Date());
                return slotTime.getHours() < currentHour ||
                    (slotTime.getHours() === currentHour && slotTime.getMinutes() < currentMinutes);
            });

            if (isTodayBooking && hasUpcomingSlots) {
                acc.today.push(booking);
            } else if (isPastDate || (isTodayBooking && hasPastSlots)) {
                acc.history.push(booking);
            } else {
                acc.upcoming.push(booking);
            }

            return acc;
        }, { upcoming: [], history: [], today: [] });
    };

    const { upcoming, history, today } = categorizeBookings();
    const filteredBookings = activeTab === 'upcoming' ? [...today, ...upcoming] : history;

    const formatDate = (dateString) => format(parseISO(dateString), 'PPpp');
    
    const formatTime = (timeString) => {
  if (!timeString) return "Invalid time";
  try {
    const parsed = parse(timeString, 'HH:mm', new Date()); 
    return format(parsed, 'hh:mm a');
  } catch (err) {
    console.error("Time format error:", timeString, err);
    return "Invalid time";
  }
};


    const canCancelBooking = (booking) => {
        const now = new Date();

        const isWithin24Hours = booking.slots.some(slot => {
            const slotDateTime = parse(slot.start, 'hh:mm a', parseISO(booking.date));
            const timeDiff = slotDateTime.getTime() - now.getTime();
            return timeDiff < 24 * 60 * 60 * 1000 && timeDiff > 0;
        });

        const bookingCreatedAt = new Date(booking.createdAt);
        const timeSinceBooking = now.getTime() - bookingCreatedAt.getTime();
        const isAfter24HoursFromBooking = timeSinceBooking < 24 * 60 * 60 * 1000;

        return !isWithin24Hours && isAfter24HoursFromBooking;
    };

    const handleCancelBooking = async (bookingId) => {
        try {
            await axios.delete(`/api/bookings/${bookingId}`);
            setBookings(bookings.filter(booking => booking._id !== bookingId));
        } catch (error) {
            console.error('Error cancelling booking:', error);
        }
    };



    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-b from-gray-900 to-gray-950">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-400 mb-4"></div>
                    <p className="text-cyan-100 font-sora text-lg">Loading your bookings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-white mb-2 font-sora">Your Bookings</h1>
                    <p className="text-gray-300 max-w-md mx-auto">
                        {activeTab === 'upcoming' ? "Upcoming reservations" : "Booking history"}
                    </p>
                </div>

                <div className="flex justify-center mb-8">
                    <div className="inline-flex rounded-full bg-gray-800 p-1">
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={`px-5 py-1.5 rounded-full text-sm ${activeTab === 'upcoming' ? 'bg-white text-gray-900' : 'text-gray-300'}`}
                        >
                            Upcoming
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-5 py-1.5 rounded-full text-sm ${activeTab === 'history' ? 'bg-white text-gray-900' : 'text-gray-300'}`}
                        >
                            History
                        </button>
                    </div>
                </div>

                {filteredBookings.length === 0 ? (
                    <div className="bg-gray-800/50 rounded-xl p-8 text-center border border-gray-700">
                        <p className="text-gray-400">
                            {activeTab === 'upcoming' ? "No upcoming bookings" : "No booking history"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredBookings.map((booking) => {
                            console.log("booking", booking)
                            const isExpanded = expandedCard === booking._id;
                            const isTodayBooking = isToday(parseISO(booking.date));
                            const isConfirmed = booking.status === 'confirmed';
                            const showCancelButton = canCancelBooking(booking);

                            return (
                                <div
                                    key={booking._id}
                                    onClick={() => setExpandedCard(isExpanded ? null : booking._id)}
                                    className={`bg-gray-800/50 rounded-lg border ${isTodayBooking ? 'border-cyan-500' : 'border-gray-700'} 
            transition-all duration-200 overflow-hidden ${isExpanded ? 'ring-2 ring-cyan-500' : ''}`}
                                >
                                    <div className="p-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className={`w-2 h-2 rounded-full ${isConfirmed ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                                                    <p className={`font-medium ${isTodayBooking ? 'text-cyan-400' : 'text-white'}`}>
                                                        {formatDate(booking.date)}
                                                    </p>
                                                </div>
                                                <p className="text-gray-300 text-sm">
                                                    Turf: {booking.turf?.name || "Unknown Turf"}
                                                </p>
                                                <p className="text-gray-300 text-sm">
                                                    {booking.slots.map(slot => `${formatTime(slot.start)} - ${formatTime(slot.end)}`).join(', ')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white font-medium">₹{booking.amountPaid}</p>
                                                {isTodayBooking && (
                                                    <p className="text-cyan-400 text-xs">Today</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="px-4 pb-4 pt-2 border-t border-gray-700">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <div>
                                                        <p className="text-xs text-gray-400">Booked on</p>
                                                        <p className="text-white text-sm">{formatDate(booking.createdAt)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-400">Payment Type</p>
                                                        <p className="text-white text-sm">{booking.paymentType || "N/A"}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div>
                                                        <p className="text-xs text-gray-400">Payment ID</p>
                                                        <p className="text-white text-sm font-mono truncate">{booking.razorpay_payment_id}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-400">Status</p>
                                                        <p className={`text-sm ${isConfirmed ? 'text-green-400' : 'text-yellow-400'}`}>
                                                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {showCancelButton && (
                                                <div className="mt-4 flex justify-end">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCancelBooking(booking._id);
                                                        }}
                                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                                                    >
                                                        Cancel Booking
                                                    </button>
                                                </div>
                                            )}

                                            {!showCancelButton && (
                                                <div className="mt-4 text-right">
                                                    <p className="text-sm text-gray-400 italic">
                                                        Cancellation not allowed due to policy.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                    </div>
                )}
            </div>
        </div>
    );
};

export default UserBookings;
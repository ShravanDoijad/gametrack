import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { parse, format, isToday, isPast, parseISO, getHours, differenceInDays } from 'date-fns';

const UserBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [expandedCard, setExpandedCard] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const [bookingsResponse, subscriptionsResponse] = await Promise.all([
                    axios.get('/api/users/allBookings'),
                    axios.get('/api/users/subscriptions')
                ]);
                
                setBookings(bookingsResponse.data.allBookings || []);
                setSubscriptions(subscriptionsResponse.data.subscriptions || []);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching user data:', error);
                setLoading(false);
            }
        };
        fetchUserData();
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

    const calculateRemainingDays = (startDate, endDate, days) => {
        const today = new Date();
        const start  = new Date(startDate)
        const end = parseISO(endDate);
        const remaining =today<=start?days:differenceInDays(end, today);
        console.log("remaining", remaining)
        return remaining > 0 ? remaining : 0;
    };

    console.log("subscription", subscriptions)
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
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-white mb-2 font-sora">Your Bookings & Subscriptions</h1>
                    <p className="text-gray-300 max-w-md mx-auto">
                        {activeTab === 'upcoming' ? "Upcoming reservations and active subscriptions" : "Booking history"}
                    </p>
                </div>

                <div className="flex justify-center mb-8">
                    <div className="inline-flex rounded-full bg-gray-800 p-1">
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                                activeTab === 'upcoming' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-300 hover:text-white'
                            }`}
                        >
                            Upcoming
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                                activeTab === 'history' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-300 hover:text-white'
                            }`}
                        >
                            History
                        </button>
                    </div>
                </div>

                {/* Active Subscriptions Section - Only show in upcoming tab */}
                {activeTab === 'upcoming' && subscriptions.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4 font-sora border-l-4 border-cyan-400 pl-3">Active Subscriptions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {subscriptions.map((subscription) => {
                                const remainingDays = calculateRemainingDays(subscription.startDate,subscription.endDate, subscription.durationDays);
                                const isActive = remainingDays > 0;
                                
                                return (
                                    <div
                                        key={subscription._id}
                                        className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-lg ${
                                            isActive ? 'border-cyan-500' : 'border-gray-600'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="text-white font-bold text-lg font-sora truncate">
                                                    {subscription.turfId?.name || "Unknown Turf"}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                                    <span className={`text-sm font-medium ${isActive ? 'text-green-400' : 'text-red-400'}`}>
                                                        {isActive ? 'Active' : 'Expired'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400 text-sm">From</span>
                                                <span className="text-white text-sm font-medium">
                                                    {format(parseISO(subscription.startDate), 'MMM dd, yyyy')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400 text-sm">To</span>
                                                <span className="text-white text-sm font-medium">
                                                    {format(parseISO(subscription.endDate), 'MMM dd, yyyy')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400 text-sm">Slot</span>
                                                <span className="text-white text-sm font-medium">
                                                    {formatTime(subscription.slot.start)} - {formatTime(subscription.slot.end)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                                            <div>
                                                <div className="text-gray-400 text-xs">Advance Paid</div>
                                                <div className="text-white font-bold">₹{subscription.amountPaid || 0}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500 text-s">Due</div>
                                                <div className="text-white font-bold">₹{subscription.totalAmount -subscription.amountPaid || 0}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-gray-400 text-xs">Remaining Days</div>
                                                <div className={`text-lg font-bold ${isActive ? 'text-cyan-400' : 'text-red-400'}`}>
                                                    {remainingDays}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Bookings Section */}
                <div>
                    {activeTab === 'upcoming' && (subscriptions.length > 0 || filteredBookings.length > 0) && (
                        <h2 className="text-xl font-bold text-white mb-4 font-sora border-l-4 border-cyan-400 pl-3">
                            {subscriptions.length > 0 ? 'Individual Bookings' : 'Your Bookings'}
                        </h2>
                    )}

                    {filteredBookings.length === 0 && (activeTab === 'history' || (activeTab === 'upcoming' && subscriptions.length === 0)) ? (
                        <div className="bg-gray-800/50 rounded-xl p-8 text-center border border-gray-700">
                            <p className="text-gray-400">
                                {activeTab === 'upcoming' ? "No upcoming bookings" : "No booking history"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredBookings.map((booking) => {
                                const isExpanded = expandedCard === booking._id;
                                const isTodayBooking = isToday(parseISO(booking.date));
                                const isConfirmed = booking.status === 'confirmed';
                                const showCancelButton = canCancelBooking(booking);

                                return (
                                    <div
                                        key={booking._id}
                                        onClick={() => setExpandedCard(isExpanded ? null : booking._id)}
                                        className={`bg-gray-800/50 rounded-lg border ${
                                            isTodayBooking ? 'border-cyan-500' : 'border-gray-700'
                                        } transition-all duration-200 overflow-hidden cursor-pointer hover:border-cyan-400 ${
                                            isExpanded ? 'ring-2 ring-cyan-500' : ''
                                        }`}
                                    >
                                        <div className="p-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className={`w-2 h-2 rounded-full ${isConfirmed ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                                                        <p className={`font-medium ${isTodayBooking ? 'text-cyan-400' : 'text-white'}`}>
                                                            {formatDate(booking.date)}
                                                        </p>
                                                    </div>
                                                    <p className="text-gray-300 font-bold text-sm font-sora">
                                                        {booking.turfId?.name || "Unknown Turf"}
                                                    </p>
                                                    <p className="text-gray-300 text-sm">
                                                        {booking.slots.map(slot => `${formatTime(slot.start)} - ${formatTime(slot.end)}`).join(', ')}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-white font-bold text-lg">₹{booking.amountPaid}</p>
                                                    {isTodayBooking && (
                                                        <p className="text-cyan-400 text-xs font-medium">Today</p>
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
                                                            <p className={`text-sm font-medium ${isConfirmed ? 'text-green-400' : 'text-yellow-400'}`}>
                                                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

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
        </div>
    );
};

export default UserBookings;
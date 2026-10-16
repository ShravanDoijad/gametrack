import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { format, isToday, parseISO, differenceInDays, isValid } from 'date-fns';
import { toast } from 'react-toastify';

const parseSlotDateTime = (dateValue, timeValue) => {
    if (!dateValue || !timeValue) return null;
    const date = parseISO(String(dateValue));
    if (!isValid(date)) return null;
    let hours;
    let minutes;
    const time24 = String(timeValue).match(/^(\d{1,2}):(\d{2})$/);
    const time12 = String(timeValue).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (time24) {
        hours = Number(time24[1]);
        minutes = Number(time24[2]);
        if (hours > 23 || minutes > 59) return null;
    } else if (time12) {
        hours = Number(time12[1]) % 12 + (time12[3].toUpperCase() === 'PM' ? 12 : 0);
        minutes = Number(time12[2]);
    } else return null;
    date.setHours(hours, minutes, 0, 0);
    return date;
};

const formatINR = (amount) => `\u20b9${(Number(amount) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const getBookingEnd = (booking) => {
    const endTimes = (booking.slots || []).map((slot) => {
        const start = parseSlotDateTime(booking.date, slot.start);
        const end = parseSlotDateTime(booking.date, slot.end);
        if (!start || !end) return null;
        if (end <= start) end.setDate(end.getDate() + 1);
        return end;
    }).filter(Boolean);
    return endTimes.length ? new Date(Math.max(...endTimes.map((date) => date.getTime()))) : null;
};

const UserBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [expandedCard, setExpandedCard] = useState(null);
    const [cancelingId, setCancelingId] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [reloadCount, setReloadCount] = useState(0);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const [bookingsResponse, subscriptionsResponse] = await Promise.all([
                    axios.get('/api/users/allBookings'),
                    axios.get('/api/users/subscriptions')
                ]);
                
                setBookings(bookingsResponse.data.allBookings || []);
                setSubscriptions(subscriptionsResponse.data.subscriptions || []);
                setLoadError('');
            } catch (error) {
                console.error('Error fetching user data:', error);
                setLoadError('Could not load your bookings. Check your connection and try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [reloadCount]);

    const categorizeBookings = () => {
        const now = new Date();

        return bookings.reduce((acc, booking) => {
            const bookingDate = parseISO(booking.date);
            const bookingEnd = getBookingEnd(booking);
            if (!isValid(bookingDate) || !bookingEnd || booking.status === 'cancelled' || bookingEnd <= now) {
                acc.history.push(booking);
            } else if (isToday(bookingDate)) {
                acc.today.push(booking);
            } else {
                acc.upcoming.push(booking);
            }

            return acc;
        }, { upcoming: [], history: [], today: [] });
    };

    const { upcoming, history, today } = categorizeBookings();
    const filteredBookings = activeTab === 'upcoming' ? [...today, ...upcoming] : history;

    const formatDate = (dateString) => {
        const date = parseISO(String(dateString || ''));
        return isValid(date) ? format(date, 'PPpp') : 'Date unavailable';
    };
    
    const formatTime = (timeString) => {
        if (!timeString) return "Invalid time";
        try {
            const parsed = parseSlotDateTime(new Date().toISOString(), timeString);
            return parsed ? format(parsed, 'hh:mm a') : 'Time unavailable';
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
        const now = Date.now();
        const bookingCreatedAt = new Date(booking.createdAt).getTime();
        const firstStart = parseSlotDateTime(booking.date, booking.slots?.[0]?.start);
        return booking.status === 'confirmed' && Number(booking.amountPaid || 0) === 0 &&
            !booking.razorpay_payment_id && Number.isFinite(bookingCreatedAt) &&
            now >= bookingCreatedAt && now - bookingCreatedAt <= 24 * 60 * 60 * 1000 && firstStart &&
            firstStart.getTime() - now > 24 * 60 * 60 * 1000;
    };

    const cancelBooking = async (booking) => {
        if (!window.confirm('Cancel this booking?')) return;
        setCancelingId(booking._id);
        try {
            const { data } = await axios.post(`/api/users/bookings/${booking._id}/cancel`);
            setBookings((current) => current.map((item) => item._id === booking._id ? { ...item, ...data.booking, turfId: item.turfId } : item));
            toast.success(data.message || 'Booking cancelled');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not cancel this booking');
        } finally {
            setCancelingId(null);
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
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-white mb-2 font-sora">Your Bookings & Subscriptions</h1>
                    <p className="text-gray-300 max-w-md mx-auto">
                        {activeTab === 'upcoming' ? "Upcoming reservations and active subscriptions" : "Booking history"}
                    </p>
                </div>

                {loadError && <div role="alert" className="mb-6 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-center text-red-200">{loadError}<button onClick={() => { setLoading(true); setReloadCount((count) => count + 1); }} className="ml-3 underline">Retry</button></div>}

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
                                                <div className="text-white font-bold">{formatINR(subscription.amountPaid || 0)}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500 text-s">Due</div>
                                                <div className="text-white font-bold">{formatINR(Math.max(0, Number(subscription.totalAmount || 0) - Number(subscription.amountPaid || 0)))}</div>
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
                                const bookingDate = parseISO(String(booking.date || ''));
                                const isTodayBooking = isValid(bookingDate) && isToday(bookingDate);
                                const isConfirmed = booking.status === 'confirmed';
                                const showCancelButton = canCancelBooking(booking);
                                const bookingEnd = getBookingEnd(booking);
                                const canReview = isConfirmed && !booking.isReviewed && bookingEnd && bookingEnd <= new Date();

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
                                                <div className="flex items-end gap-2 text-right sm:items-center">
                                                    <p className="text-white font-bold text-lg">{formatINR(booking.amountPaid)}</p>
                                                    {isTodayBooking && (
                                                        <p className="text-cyan-400 text-xs font-medium">Today</p>
                                                    )}
                                                    {canReview && <Link to={`/review?turfId=${booking.turfId?._id || booking.turfId}&bookingId=${booking._id}`} onClick={(event) => event.stopPropagation()} className="rounded-lg bg-lime-400 px-3 py-2 text-xs font-bold text-black transition hover:bg-lime-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Rate visit</Link>}
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

                                                {showCancelButton ? (
                                                    <button type="button" disabled={cancelingId === booking._id} onClick={(event) => { event.stopPropagation(); cancelBooking(booking); }} className="mt-4 rounded-lg border border-red-400/40 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50">
                                                        {cancelingId === booking._id ? 'Cancelling' : 'Cancel booking'}
                                                    </button>
                                                ) : booking.status === 'confirmed' && (
                                                    <p className="mt-4 text-right text-sm text-gray-400">Cancellation is available within 24 hours of booking, more than 24 hours before the slot. Paid bookings require contacting the turf for refund arrangements.</p>
                                                )}
                                                {isConfirmed && booking.isReviewed && <p className="mt-4 text-sm font-medium text-lime-300">Review submitted</p>}
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

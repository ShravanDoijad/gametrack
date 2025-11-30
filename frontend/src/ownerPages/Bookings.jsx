import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Calendar,
  ArrowUpDown,
  AlertCircle,
  XCircle,
  CheckCircle,
  Download,
  User,
  Phone,
} from "lucide-react";
import { BookContext } from "../constexts/bookContext";
import { toast } from "react-toastify";

const Bookings = () => {
  const {
    bookings,
    setbookings,
    selectedTurfId,
    setSelectedTurfId,
    setCancelled,
    cancelled,
  } = useContext(BookContext);

  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    booking: null,
  });

  // Filter bookings based on active filter
  const filteredBookings = bookings.filter((booking) => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (activeFilter) {
      case "upcoming":
        return bookingDate >= today && booking.status !== "cancelled";
      case "past":
        return bookingDate < today && booking.status !== "cancelled";
      case "cancelled":
        return booking.status === "cancelled";
      case "confirmed":
        return booking.status === "confirmed";
      case "manual":
        return booking.paymentType?.toLowerCase() === "manual";
      default:
        return true;
    }
  });

  // Sort bookings by date
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    } catch (err) {
      return timeString;
    }
  };

  const getUserInfo = (booking) => {
    if (booking.userId) {
      return {
        name: booking.userId.name || "N/A",
        phone: booking.userId.phone || "N/A",
        email: booking.userId.email || "N/A"
      };
    }
    return {
      name: booking.name || "Guest",
      phone: booking.phone || "N/A",
      email: "N/A"
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "text-green-400";
      case "cancelled":
        return "text-red-400";
      case "pending":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  const calculateEstimatedAmount = (booking) => {
    if (!booking.amountPaid || !booking.slotFees) return 0;
    return Math.max(0, booking.slotFees - booking.amountPaid);
  };

  const downloadPDF = async () => {
    try {
      const response = await axios.get("/owner/generate-bookings-pdf", {
        responseType: "blob",
        params: {
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          turfId: selectedTurfId
        }
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `bookings-${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF");
    }
  };

  const cancelBooking = async (id, date, start, end) => {
    try {
      if (!id || !date || !start || !end) {
        setError("Invalid booking details provided.");
        return;
      }
      const res = await axios.post("/owner/cancelBooking", {
        bookingId: id,
        turfId: selectedTurfId,
        date: date,
        start: start,
        end: end,
      });
      toast.success("Booking cancelled successfully");
      setCancelled((prev) => !prev);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      setError("Failed to cancel booking. Please try again later.");
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 max-w-xs text-center shadow-2xl">
          <AlertCircle className="mx-auto h-12 w-12 text-rose-400 mb-3" />
          <p className="text-rose-300 font-sora font-medium mb-1">Data Error</p>
          <p className="text-gray-400 font-sora text-sm">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-4 px-4 py-2 bg-rose-900/50 text-rose-300 rounded-lg border border-rose-800 text-sm font-sora hover:bg-rose-800/30 transition"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black px-4 sm:px-6 py-6 overflow-auto">
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Cancel Confirmation Modal */}
        {confirmModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <XCircle className="mx-auto text-red-400 h-12 w-12 mb-3" />
              <h2 className="text-white text-lg font-sora font-semibold text-center">
                Cancel Booking?
              </h2>
              <p className="text-gray-400 text-sm text-center mt-1 mb-4">
                Are you sure you want to cancel this booking?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    cancelBooking(
                      confirmModal.booking._id,
                      confirmModal.booking.date,
                      confirmModal.booking.originalSlots?.[0]?.start || confirmModal.booking.slots[0].start,
                      confirmModal.booking.originalSlots?.[0]?.end || confirmModal.booking.slots[0].end
                    );
                    setConfirmModal({ open: false, booking: null });
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-sora flex items-center justify-center gap-1"
                >
                  <CheckCircle size={16} /> Yes, Cancel
                </button>
                <button
                  onClick={() => setConfirmModal({ open: false, booking: null })}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-2 rounded-lg font-sora"
                >
                  Keep Booking
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-lime-500 font-sora">
              Booking Management
            </h1>
            <p className="text-gray-500 text-sm mt-1 font-sora">
              Professional turf booking dashboard
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 border border-gray-800">
              <div className="flex items-center space-x-2 text-lime-300">
                <Calendar size={18} />
                <span className="font-sora font-medium text-sm">
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })}
                </span>
              </div>
            </div>
            <button
              onClick={downloadPDF}
              className="bg-lime-600 hover:bg-lime-700 text-white px-4 py-2 rounded-lg font-sora text-sm flex items-center gap-2 transition-colors"
            >
              <Download size={16} />
              Export PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          {[
            { key: "all", label: "All Bookings" },
            { key: "upcoming", label: "Upcoming" },
            { key: "confirmed", label: "Confirmed" },
            { key: "cancelled", label: "Cancelled" },
            { key: "manual", label: "Manual Payment" },
            { key: "past", label: "Past Bookings" },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-4 py-2 rounded-lg text-sm font-sora font-medium transition-all ${
                activeFilter === filter.key
                  ? "bg-lime-500 text-gray-900 shadow-lg"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              {filter.label}
            </button>
          ))}
          
          <Link
            to={"/owner/turfTodaysbookings"}
            className="ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-sora font-medium transition-colors"
          >
            Today's Bookings
          </Link>
          
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="px-4 py-2 rounded-lg text-sm font-sora font-medium flex items-center bg-gray-800 text-lime-300 hover:bg-gray-700 transition-colors"
          >
            <ArrowUpDown className="mr-2" size={16} />
            {sortOrder === "asc" ? "Oldest First" : "Newest First"}
          </button>
        </div>

        {/* Bookings Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-900 text-gray-300">
              <tr>
                <th className="px-6 py-4 border-b border-gray-800 font-sora font-semibold">Date & Time</th>
                <th className="px-6 py-4 border-b border-gray-800 font-sora font-semibold">Slots</th>
                <th className="px-6 py-4 border-b border-gray-800 font-sora font-semibold">Customer</th>
                <th className="px-6 py-4 border-b border-gray-800 font-sora font-semibold">Advance</th>
                <th className="px-6 py-4 border-b border-gray-800 font-sora font-semibold">Balance</th>
                <th className="px-6 py-4 border-b border-gray-800 font-sora font-semibold">Status</th>
                <th className="px-6 py-4 border-b border-gray-800 font-sora font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedBookings.map((booking) => {
                const userInfo = getUserInfo(booking);
                const estimatedAmount = calculateEstimatedAmount(booking);
                const slotsToShow = booking.originalSlots || booking.slots;

                return (
                  <tr
                    key={booking._id}
                    className="bg-gray-800/40 border-b border-gray-700 hover:bg-gray-800/60 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-white font-sora">
                        {formatDate(booking.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {slotsToShow.map((slot, index) => (
                          <div key={index} className="text-gray-300 text-xs font-medium">
                            {formatTime(slot.start)} - {formatTime(slot.end)}
                          </div>
                        ))}
                        <div className="text-gray-500 text-xs">
                          {slotsToShow.length} slot{slotsToShow.length > 1 ? 's' : ''}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-white font-medium">
                          <User size={14} />
                          {userInfo.name}
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                          <Phone size={14} />
                          {userInfo.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-amber-400 font-sora font-semibold">
                        ₹{booking.amountPaid || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-green-400 font-sora font-semibold">
                        ₹{estimatedAmount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-sora font-medium capitalize ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setConfirmModal({ open: true, booking })}
                        disabled={booking.status === "cancelled"}
                        className={`rounded-lg px-4 py-2 text-sm font-sora font-medium transition-all duration-200 ${
                          booking.status === "cancelled"
                            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md"
                        }`}
                      >
                        {booking.status === "cancelled" ? "Cancelled" : "Cancel"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Stats */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500 font-sora">
          <div>
            Showing{" "}
            <span className="font-medium text-lime-300">
              {filteredBookings.length}
            </span>{" "}
            of <span className="font-medium text-white">{bookings.length}</span>{" "}
            bookings
          </div>
          <div className="text-xs text-gray-600">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bookings;
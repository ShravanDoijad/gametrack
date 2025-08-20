import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Calendar,
  ArrowUpDown,
  AlertCircle,
  XCircle,
  CheckCircle,
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

  let filteredBookings = bookings;

  if (activeFilter === "cancelled") {
    filteredBookings = bookings.filter(
      (booking) => booking.status === "cancelled"
    );
  } else {
    filteredBookings = bookings.filter((b) => b.status !== "cancelled");
  }

  filteredBookings = filteredBookings.filter((booking) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "manual")
      return booking.paymentType?.toLowerCase() === "manual";
    if (activeFilter === "advance") return booking.paymentType === "advance";
    if (activeFilter === "confirmed") return booking.status === "confirmed";
    if (activeFilter === "upcoming")
      return new Date(booking.date) >= new Date();
    if (activeFilter === "past") return new Date(booking.date) < new Date();
    return true;
  });

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

  const cancelBooking = async (id, date, start, end) => {
    try {
      console.log("cancelBooking called with", id, date, start, end);
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

  console.log("confirmModal", confirmModal);

  return (
    <div className="min-h-screen w-full bg-black px-4 sm:px-6 py-6 overflow-auto">
      <div className="relative z-10 max-w-6xl mx-auto">
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
                      confirmModal.booking.slots[0].start,
                      confirmModal.booking.slots[0].end
                    );
                    setConfirmModal({ open: false, booking: null });
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-sora flex items-center justify-center gap-1"
                >
                  <CheckCircle size={16} /> Yes, Cancel
                </button>
                <button
                  onClick={() =>
                    setConfirmModal({ open: false, booking: null })
                  }
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-2 rounded-lg font-sora"
                >
                  Keep Booking
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-lime-500 font-sora">
              Booking Command Center
            </h1>
            <p className="text-gray-500 text-sm mt-1 font-sora">
              Turf management dashboard
            </p>
          </div>
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 border border-gray-800">
            <div className="flex items-center space-x-2 text-lime-300">
              <Calendar size={18} />
              <span className="font-sora font-medium text-sm">
                {new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2 items-center">
          {[
            "all",
            "upcoming",
            "confirmed",
            "cancelled",
            "manual",
            "advance",
            "past",
          ].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-sora font-medium transition-all ${activeFilter === filter
                  ? "bg-lime-500 text-gray-900"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
          <Link
            className="text-sm ml-2 text-blue-500 hover:underline"
            to={"/owner/turfTodaysbookings"}
          >
            today's Bookings
          </Link>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className={`px-4 py-2 rounded-lg text-sm font-sora font-medium flex items-center ml-auto ${"bg-gray-800 text-lime-300"}`}
          >
            <ArrowUpDown className="mr-2" size={16} />
            {sortOrder === "asc" ? "Oldest First" : "Newest First"}
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
                <th className="px-4 py-2 border-b border-gray-800">
                  Interaction
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedBookings.map((booking) => {
                const advance =
                  booking.amountPaid > 0 ? booking.amountPaid : "N/A";

                let estimatedAmount = 0;
                if (booking.amountPaid) {
                  const rate = booking.slotFees;
                  estimatedAmount = rate - booking.amountPaid;
                }
                return (
                  <tr
                    key={booking._id}
                    className="bg-gray-800/40 border-b border-gray-700 hover:bg-gray-800/60"
                  >
                    <td className="px-4 py-2 font-medium text-white">
                      {formatDate(booking.date)}
                    </td>
                    <td className="px-4 py-2">
                      {booking.slots.length} slot(s)
                    </td>
                    <td className="px-4 py-2 text-amber-400">₹{advance}</td>
                    <td className="px-4 py-2 text-green-400">
                      ₹{estimatedAmount}
                    </td>
                    <td className="px-4 py-2 capitalize">{booking.status}</td>
                    <td className="px-4 py-2 text-white">
                      {booking.userId?.email ||
                        booking.userId?.phone ||
                        booking.phone}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => setConfirmModal({ open: true, booking })}
                        disabled={booking.status === "cancelled"}
                        className={`rounded-md px-3 py-1 text-sm font-medium transition-colors duration-200
                          ${booking.status === "cancelled"
                            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                            : "bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow-md"
                          }`}
                      >
                        {booking.status === "cancelled"
                          ? "Cancelled"
                          : "Cancel"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500 font-sora">
          Showing{" "}
          <span className="font-medium text-lime-300">
            {filteredBookings.length}
          </span>{" "}
          of <span className="font-medium text-white">{bookings.length}</span>{" "}
          bookings
        </div>
      </div>
    </div>
  );
};

export default Bookings;

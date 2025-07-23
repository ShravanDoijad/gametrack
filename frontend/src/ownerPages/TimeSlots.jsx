import React, { useState, useEffect, useContext } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { AlertTriangle, PlusCircle, Loader2, Calendar, Clock } from "lucide-react";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";
import { addDays, format } from "date-fns";
import axios from "axios";
import { BookContext } from "../constexts/bookContext";
import { toast } from "react-toastify";

const TimeSlots = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmingSlot, setConfirmingSlot] = useState(null);
  const [manualSlotModal, setManualSlotModal] = useState(false);
  const [manualStart, setManualStart] = useState("06:00");
  const [manualEnd, setManualEnd] = useState("07:00");

  const { selectedTurfId } = useContext(BookContext);
  const formattedDate = selectedDate.toISOString().split("T")[0];

  useEffect(() => {
    const fetchSlots = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`/owner/availableSlots`, {
          params: { turfId: selectedTurfId, date: formattedDate },
        });
        const bookedOnly = res.data.slots?.filter((s) => s.status === "booked") || [];
        setSlots(bookedOnly);
      } catch (err) {
        console.error("Failed to fetch slots:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlots();
  }, [selectedDate, selectedTurfId]);

  const toggleSlotStatus = async (slot) => {
    const newStatus = slot.status === "booked" ? "available" : "booked";
    try {
      await axios.patch(`/owner/update-status`, {
        turfId: selectedTurfId,
        date: formattedDate,
        start: slot.start,
        end: slot.end,
        newStatus,
      });

      setSlots((prev) =>
        prev.filter((s) => !(s.start === slot.start && s.end === slot.end))
      );
      setConfirmingSlot(null);
    } catch (err) {
      console.error("Failed to update slot status:", err);
    }
  };

  const handleManualBooking = async () => {
    try {
      await axios.patch(`/owner/update-status`, {
        turfId: selectedTurfId,
        date: formattedDate,
        start: manualStart,
        end: manualEnd,
        newStatus: "booked",
      });

      setSlots((prev) => [
        ...prev,
        {
          start: manualStart,
          end: manualEnd,
          status: "booked",
          _id: `${manualStart}-${manualEnd}`,
        },
      ]);
      setManualSlotModal(false);
    } catch (err) {
      console.error("Failed to manually book slot:", err);
      toast.error(err.response.message || "Unable To update Slot")
    }
  };

  const formatDateDisplay = (date) => {
    return format(date, "EEEE, MMMM d, yyyy");
  };

  const formatShortDate = (date) => {
    return format(date, "MMM d");
  };

  return (
    <div className="p-6 min-h-screen text-white font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight font-sora">
              Booking Dashboard
            </h2>
            <p className="text-neutral-400 mt-2">
              Manage your turf bookings and availability
            </p>
          </div>
          <button
            onClick={() => setManualSlotModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-blue-500/20"
          >
            <PlusCircle size={20} /> Create Booking
          </button>
        </div>

        {/* Date Selection */}
        <div className="mb-8 bg-neutral-800/50 p-5 rounded-xl border border-neutral-700">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-1">
              <label className="block text-sm text-neutral-300 mb-2 font-medium">
                SELECT DATE
              </label>
              <div className="relative">
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  minDate={new Date()}
                  maxDate={addDays(new Date(), 30)}
                  className="text-black p-3 pl-12 rounded-lg border border-gray-300 w-full focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all bg-white"
                  calendarClassName="!bg-white !text-black !border !border-gray-300 !shadow-xl"
                  wrapperClassName="w-full"
                  popperPlacement="bottom-start"
                  dayClassName={(date) => {
                    const isWithinRange =
                      date >= new Date() && date <= addDays(new Date(), 30);
                    return isWithinRange
                      ? "text-black hover:bg-blue-100 transition-colors"
                      : "text-gray-400 bg-white cursor-not-allowed";
                  }}
                  renderCustomHeader={({
                    date,
                    decreaseMonth,
                    increaseMonth,
                    prevMonthButtonDisabled,
                    nextMonthButtonDisabled,
                  }) => (
                    <div className="flex items-center justify-between px-2 py-2">
                      <button
                        onClick={decreaseMonth}
                        disabled={prevMonthButtonDisabled}
                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
                      >
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-gray-900 font-medium">
                        {format(date, "MMMM yyyy")}
                      </span>
                      <button
                        onClick={increaseMonth}
                        disabled={nextMonthButtonDisabled}
                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
                      >
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                />

                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Calendar className="text-blue-600" size={20} />
                </div>

              </div>
            </div>

            <div className="flex-1">
              <div className="bg-neutral-900/50 border border-neutral-700 rounded-lg p-4 h-full">
                <p className="text-sm text-neutral-400 mb-1">Selected Date</p>
                <p className="text-xl font-semibold text-white">
                  {formatDateDisplay(selectedDate)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings Section */}
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-white font-sora mb-2">
            Booked Slots
          </h3>
          <p className="text-neutral-400">
            {slots.length} booking{slots.length !== 1 ? "s" : ""} for {formatShortDate(selectedDate)}
          </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center mt-10">
            <Loader2 className="animate-spin h-10 w-10 text-blue-400" />
          </div>
        ) : slots.length === 0 ? (
          <div className="bg-neutral-900/50 border border-dashed border-neutral-700 rounded-xl p-8 text-center">
            <div className="max-w-md mx-auto">
              <Clock className="mx-auto h-12 w-12 text-neutral-600 mb-4" />
              <h4 className="text-lg font-medium text-neutral-300 mb-2">
                No bookings yet for this date
              </h4>
              <p className="text-neutral-500 mb-4">
                You can add manual bookings or wait for online reservations
              </p>
              <button
                onClick={() => setManualSlotModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium inline-flex items-center gap-2"
              >
                <PlusCircle size={18} /> Create Booking
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slots.map((slot) => (
              <div
                key={slot._id}
                className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 rounded-xl p-5 flex flex-col shadow-lg hover:shadow-blue-500/10 transition-all group"
              >
                <div className="flex-grow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-2xl font-bold text-white sora">
                        {slot.start} - {slot.end}
                      </span>
                      <p className="text-sm text-neutral-400 mt-1">Time Slot</p>
                    </div>
                    <span className="px-2.5 py-1 bg-green-900/30 text-green-400 text-xs rounded-full font-medium inline-flex items-center">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                      Booked
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmingSlot(slot)}
                  className="mt-4 w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 font-medium px-4 py-2.5 rounded-lg hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Release Slot
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmingSlot && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4 backdrop-blur-sm">
            <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-700 w-full max-w-md shadow-2xl">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 p-3 bg-amber-400/10 rounded-full">
                  <AlertTriangle className="text-amber-400" size={40} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 font-sora">
                  Confirm Slot Release
                </h3>
                <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
                  You're about to mark <span className="font-semibold text-white">{confirmingSlot.start} - {confirmingSlot.end}</span> as available.
                  <br />
                  <span className="text-amber-400 mt-2 inline-block font-medium">
                    This action cannot be undone
                  </span>
                </p>
                <div className="flex gap-4 w-full">
                  <button
                    onClick={() => setConfirmingSlot(null)}
                    className="flex-1 border border-neutral-700 px-4 py-3 text-neutral-300 rounded-lg hover:bg-neutral-800 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => toggleSlotStatus(confirmingSlot)}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold px-4 py-3 rounded-lg hover:from-amber-400 hover:to-amber-500 transition-colors font-sora"
                  >
                    Confirm Release
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manual Booking Modal */}
        {manualSlotModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4 backdrop-blur-sm">
            <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-700 w-full max-w-md shadow-2xl">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-1 text-center font-sora">
                  Create New Booking
                </h3>
                <p className="text-center text-blue-400 font-medium">
                  {formatDateDisplay(selectedDate)}
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-neutral-300 mb-2 font-medium uppercase tracking-wider">
                    Time Slot
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white rounded-2xl shadow-md">
                    {/* Start Time */}
                    <div className="flex flex-col space-y-2">
                      <label className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                        <Clock className="w-5 h-5 text-blue-500" />
                        Start Time
                      </label>
                      <TimePicker
                        value={manualStart}
                        onChange={setManualStart}
                        disableClock={true}
                        clearIcon={null}
                        className="w-fit border border-gray-300 rounded-xl px-4 py-3 text-xl font-medium  text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                      />
                    </div>

                    {/* End Time */}
                    <div className="flex flex-col space-y-2">
                      <label className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                        <Clock className="w-5 h-5 text-blue-500" />
                        End Time
                      </label>
                      <TimePicker
                        value={manualEnd}
                        onChange={setManualEnd}
                        disableClock={true}
                        clearIcon={null}
                        className="w-fit border border-gray-300 rounded-xl px-4 py-3 text-xl font-medium  text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                      />
                    </div>
                  </div>


                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={() => setManualSlotModal(false)}
                  className="border border-neutral-700 px-5 py-2.5 text-neutral-300 rounded-lg hover:bg-neutral-800 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualBooking}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 font-sora"
                >
                  <PlusCircle size={18} /> Confirm Booking
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeSlots;
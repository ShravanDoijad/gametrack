import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CircleX, Loader2 } from "lucide-react";
import axios from "axios";
import { BookContext } from "../constexts/bookContext";
import { useContext } from "react";

const TimeSlots = () => {
  const [date, setDate] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmingSlot, setConfirmingSlot] = useState(null);
  const [selectedTurf, setselectedTurf] = useState('')
    const {userInfo, selectedTurfId,
        setSelectedTurfId} = useContext(BookContext)
    
    const formattedDate = date.toISOString().split("T")[0];
    
    const turfId = userInfo.turfId
  
  useEffect(() => {
    const fetchSlots = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`/owner/turfId=${selectedTurfId}/availableSlots`, {
           params: {
        
        date: formattedDate, 
      }
        });
        setSlots(res.data.slots || []);
        
      } catch (err) {
        console.error("Failed to fetch slots:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlots();
  }, [date]);
  console.log("SLots",slots)
 const toggleSlotStatus = async (slot) => {
  const newStatus =
    slot.status === "booked" ? "available" : "booked";

  try {
    await axios.patch("/owner/update-status", {
      turfId:selectedTurfId,
      date: formattedDate,
      start: slot.start,
      end: slot.end,
      newStatus,
    });

    setSlots((prev) =>
      prev.map((s) =>
        s.start === slot.start && s.end === slot.end
          ? { ...s, status: newStatus }
          : s
      )
    );
    setConfirmingSlot(null);
  } catch (err) {
    console.error(" Failed to update slot status:", err);
  }
};

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <h2 className="text-2xl font-bold text-lime-400 mb-4">Slot Manager</h2>
      <DatePicker
        selected={date}
        onChange={(d) => setDate(d)}
        className="bg-gray-800 text-white p-2 rounded mb-4"
      />

      {isLoading ? (
        <div className="flex justify-center items-center mt-10">
          <Loader2 className="animate-spin h-10 w-10 text-lime-400" />
        </div>
      ) : slots.length === 0 ? (
        <p className="text-gray-400">No slots found for selected date.</p>
      ) : (
        <div className="space-y-3">
          {slots.map((slot) => (
            <div
              key={slot._id}
              className={`p-4 rounded flex justify-between items-center ${
                slot.status === "booked"
                  ? "bg-red-900/50"
                  : slot.status === "unavailable"
                  ? "bg-red-900/50"
                  : "bg-gray-800"
              }`}
            >
              <div>
                <p className="font-bold text-lg">
                  {slot.start} - {slot.end}
                </p>
                <p className="text-sm text-gray-400 capitalize">
                  {slot.status}
                </p>
              </div>

              <button
                onClick={() => setConfirmingSlot(slot)}
                className="px-3 py-1 bg-gray-700 text-sm rounded hover:bg-gray-600"
              >
                {slot.status === "booked"
                  ? "Convert to Available"
                  : "Mark Unavailable"}
              </button>
            </div>
          ))}
        </div>
      )}

      {confirmingSlot && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 max-w-md text-center">
            <CircleX className="mx-auto h-12 w-12 text-rose-400 mb-3" />
            <p className="text-white font-bold mb-2">Confirm Action</p>
            <p className="text-gray-400 mb-4">
              {confirmingSlot.status === "booked"
                ? "Are you sure you want to convert this booked slot to available?"
                : "Are you sure you want to mark this slot as unavailable?"}
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => toggleSlotStatus(confirmingSlot)}

                className="bg-rose-600 px-4 py-2 rounded text-white hover:bg-rose-700"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmingSlot(null)}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSlots;

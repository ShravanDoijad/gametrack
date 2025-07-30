import React, { useEffect, useState, useContext } from "react";
import { motion } from "framer-motion";
import { Clock3 } from "lucide-react";
import { BookContext } from "../constexts/bookContext";
const SelectCheckOut = ({
  selectedCheckOut,
  selectedCheckIn,
  handleCheckOut,
  allSlots,
  selectedDate,
  getSingleTurf
}) => {
  const [turfInfo, setTurfInfo] = useState(null);
  const {turfs, selectedTurfId} = useContext(BookContext)
  const turfData = turfs.find((turf)=>turf._id===selectedTurfId)
  useEffect(() => {
   
    const fetchTurfInfo = async () => {
      const turfId = localStorage.getItem("selectedTurf");
      if (turfId) {
        const data = await getSingleTurf(turfId);
        setTurfInfo(data);
      }
    };
    !turfData?
    fetchTurfInfo():setTurfInfo(turfData);
    
  }, []);

  console.log("allSlots", selectedCheckIn)

  const timeStringToMinutes = time => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const getFilteredCheckoutTimes = () => {
    if (!turfInfo) return [];

    const checkInIndex = allSlots.findIndex(
      (slot) => slot.military === selectedCheckIn
    );

    let nextBookingIndex = allSlots.length;
    const maxCheckoutIndex = checkInIndex + 8;

    const dateStr = selectedDate.toISOString().split("T")[0];
    const bookedForDate = turfInfo.bookedSlots?.find(
      (slot) => slot.date === dateStr
    );

    if (bookedForDate) {
      for (let slot of bookedForDate.slots) {
        const index = allSlots.findIndex((s) => s.military === slot.start);
        if (index > checkInIndex) {
          nextBookingIndex = Math.min(nextBookingIndex, index, maxCheckoutIndex);
        }
      }
    } else {
      nextBookingIndex = Math.min(nextBookingIndex, maxCheckoutIndex);
    }
    return allSlots.slice(checkInIndex + 2, nextBookingIndex + 1).map((slot, idx) => ({
      display: slot.display,
      duration: ((timeStringToMinutes(slot.military) - timeStringToMinutes(selectedCheckIn)) / 60).toFixed(1),
    }));
  };
  console.log("slots", allSlots.map(slot=>slot))
  return (
    <motion.div
      className="mt-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h3 className="text-2xl sora-font font-bold mb-6 text-white tracking-tight">
        Select Check-out Time
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {turfInfo &&
          getFilteredCheckoutTimes().map((slot, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCheckOut(slot.display)}
              className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${selectedCheckOut === slot.display
                  ? "bg-yellow-400 text-gray-900 border-yellow-500 shadow-lg"
                  : "bg-gray-800 text-white flex items-center justify-between border-gray-700 hover:border-gray-600"
                }`}
            >
              <div className="flex-col items-center justify-between px-auto">
                <div className="flex items-center justify-between">

                  <span className="text-md sora font-semibold  text-lime-300">
                    {slot.duration} hour{slot.duration > 1 ? "s" : ""}

                  </span>
                </div>
                <div className="text-center  mt-1.5 w-15 h-[0.5px] bg-gray-500"></div>

                <div className="mt-1.5 text-sm text-gray-300 sora">
                  <span className="font-medium ">
                    {slot.display}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
      </div>
    </motion.div>
  );
};

export default SelectCheckOut;
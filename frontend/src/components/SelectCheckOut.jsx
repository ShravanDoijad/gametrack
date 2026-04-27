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
      <h3 className="text-2xl font-extrabold mb-6 text-white tracking-tight">
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
              className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 border shadow-sm flex flex-col items-center justify-center ${selectedCheckOut === slot.display
                  ? "bg-lime-400 text-gray-950 border-lime-400 shadow-[0_0_20px_rgba(163,230,53,0.4)] scale-105"
                  : "bg-white/5 backdrop-blur-md text-gray-200 border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]"
                }`}
            >
              <div className="flex flex-col items-center justify-center w-full">
                <span className={`text-sm font-bold tracking-wide uppercase ${selectedCheckOut === slot.display ? 'text-gray-800' : 'text-lime-400'}`}>
                  {slot.duration} hour{slot.duration > 1 ? "s" : ""}
                </span>
                
                <div className={`mt-2 mb-2 w-12 h-[2px] rounded-full ${selectedCheckOut === slot.display ? 'bg-gray-950/20' : 'bg-white/10'}`}></div>

                <div className={`text-lg font-extrabold tracking-tight ${selectedCheckOut === slot.display ? 'text-gray-950' : 'text-white'}`}>
                  {slot.display}
                </div>
              </div>
            </motion.div>
          ))}
      </div>
    </motion.div>
  );
};

export default SelectCheckOut;
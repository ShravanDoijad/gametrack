import React, { useState, useContext, useEffect } from "react";
import { motion, time } from "framer-motion";
import {toast} from "react-toastify"
import axios from 'axios'
import { Sunrise, Sun, Moon } from "lucide-react";
const SelectCheckIn = ({
  filteredCheckinTimes,
  selectedDate,
  selectedCheckIn,
  handleCheckIn,
  availableTimes,
}) => {
  const [turfInfo, setturfInfo] = useState();
  const [loading, setloading] = useState(false);
  const [activeZone, setActiveZone] = useState("morning");



  const getSingleTurf = async (turfId) => {
    try {
      setloading(true);
      const res = await axios.get("/api/turfs/getSingleTurf", {
        params: { id: turfId },
      });
      setturfInfo(res.data.turf);
    } catch (error) {
      
      toast.error(error.response?.data?.message || "Internal server Error");
    } finally {
      setloading(false);
    }
  };

  useEffect(() => {
    const savedTurf = localStorage.getItem("selectedTurf");
    if (savedTurf) {
      getSingleTurf(savedTurf);
    }
  }, []);


  const timeStringToMinutes = time => {
      const [h, m] = time.split(':').map(Number);
      
      return h * 60 + m;
    };



   const getSlotsByTimeZone = (zone) => {
  const openingMinutes = timeStringToMinutes(turfInfo.openingTime);
  const closingMinutes = timeStringToMinutes(turfInfo.closingTime);

  return filteredCheckinTimes.filter((slot) => {
    const minutes = slot.hour * 60 + slot.minute;
    if (minutes < openingMinutes || minutes >= closingMinutes) return ;
    ;

    if (zone === "morning") return slot.hour < 12;
    if (zone === "afternoon") return slot.hour >= 12 && slot.hour < 17;
    if (zone === "night") return slot.hour >= 17;

    return false;
  });
};

console.log("turfInfo", turfInfo)

const visibleSlots = turfInfo ? getSlotsByTimeZone(activeZone) : [];

const TimeZoneButton = ({ zone, icon, gradient }) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setActiveZone(zone)}
      className={`flex-1 py-3 px-4 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border ${
        activeZone === zone 
          ? `${gradient} text-white border-transparent shadow-[0_10px_20px_rgba(0,0,0,0.3)] transform scale-105`
          : "bg-white/5 backdrop-blur-md border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-white"
      }`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium capitalize">{zone}</span>
      </div>
    </motion.button>
  );
  
  console.log("visibleSlot", visibleSlots)
  return (
    <motion.div
      className="mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h3 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Select Check-in Time</h3>
        <p className="text-gray-400 font-medium">Choose your preferred playing time</p>
      </div>

      <div className="flex gap-3 mb-6 overflow-scroll  scroll-smooth">
        <TimeZoneButton 
          zone="morning" 
          icon={<Sunrise className="w-5 h-5" />} 
          gradient="bg-gradient-to-r from-amber-400 to-orange-500"
        />
        <TimeZoneButton 
          zone="afternoon" 
          icon={<Sun className="w-5 h-5" />} 
          gradient="bg-gradient-to-r from-sky-400 to-blue-500"
        />
        <TimeZoneButton 
          zone="night" 
          icon={<Moon className="w-5 h-5" />} 
          gradient="bg-gradient-to-r from-purple-500 to-indigo-600"
        />
      </div>
      {loading && (
        <div className="flex justify-center items-center min-h-[100px]">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      

      <div className="grid grid-cols-2 gap-3 z-50">
        {visibleSlots?.map((slot, idx) => {
          const isBooked = turfInfo?.bookedSlots
            ?.find((s) => s.date === selectedDate.toISOString().split("T")[0])
            ?.slots?.some((b) => b.start === slot.military);

          const isAvailable = availableTimes.includes(slot.display);
          
          return (
            <div
              key={idx}
              onClick={() => isAvailable && handleCheckIn(slot.display)}
              className={`px-4 py-3 rounded-xl text-center border transition-all duration-300 font-medium ${
                selectedCheckIn === slot.display
                  ? "bg-lime-400 text-gray-950 border-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.4)] scale-105 font-bold"
                  : isBooked
                  ? "bg-rose-500/10 text-rose-400/50 border-rose-500/20 cursor-not-allowed"
                  : isAvailable
                  ? "bg-white/5 backdrop-blur-md text-gray-200 border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer"
                  : "bg-white/5 text-gray-600/50 border-transparent cursor-not-allowed"
              }`}
            >
              {slot.display}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default SelectCheckIn;

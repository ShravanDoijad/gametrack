import { useState } from "react";
import { motion } from "framer-motion";
import { Sunrise, Sun, Moon } from "lucide-react";
const SelectCheckIn = ({
  filteredCheckinTimes,
  selectedDate,
  selectedCheckIn,
  handleCheckIn,
  availableTimes,
  turfInfo,
}) => {
  const [activeZone, setActiveZone] = useState("morning");



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

const visibleSlots = turfInfo ? getSlotsByTimeZone(activeZone) : [];

const TimeZoneButton = ({ zone, icon }) => (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={() => setActiveZone(zone)}
      className={`flex-1 py-3 px-4 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border ${
        activeZone === zone
          ? "border-green-800 bg-green-800 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-green-700 hover:bg-green-50"
      }`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium capitalize">{zone}</span>
      </div>
    </motion.button>
  );
  
  return (
    <motion.div
      className="mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-4">
        <h3 className="mb-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">Select a start time</h3>
        <p className="text-sm text-slate-600">Choose from the available slots.</p>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        <TimeZoneButton 
          zone="morning" 
          icon={<Sunrise className="w-5 h-5" />} 
        />
        <TimeZoneButton 
          zone="afternoon" 
          icon={<Sun className="w-5 h-5" />} 
        />
        <TimeZoneButton 
          zone="night" 
          icon={<Moon className="w-5 h-5" />} 
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visibleSlots?.map((slot, idx) => {
          const isBooked = turfInfo?.bookedSlots
            ?.find((s) => s.date === selectedDate.toISOString().split("T")[0])
            ?.slots?.some((b) => b.start === slot.military);

          const isAvailable = availableTimes.includes(slot.display);
          
          return (
            <button
              type="button"
              key={idx}
              onClick={() => isAvailable && handleCheckIn(slot.display)}
              className={`px-4 py-3 rounded-xl text-center border transition-all duration-300 font-medium ${
                selectedCheckIn === slot.display
                  ? "bg-green-800 text-white border-green-800 font-bold"
                  : isBooked
                  ? "bg-rose-50 text-rose-400 border-rose-100 cursor-not-allowed"
                  : isAvailable
                  ? "bg-white text-slate-700 border-slate-200 hover:border-green-700 hover:bg-green-50 cursor-pointer"
                  : "bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed"
              }`}
            >
              {slot.display}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default SelectCheckIn;

import React, { useState, useContext, useEffect } from "react";
import { motion, time } from "framer-motion";

import { CalendarDays, Calendar, Clock3 } from "lucide-react";
import { BookContext } from "../constexts/bookContext";

const SelectCheckIn = ({filteredCheckinTimes, selectedDate,selectedCheckIn, handleCheckIn, availableTimes, 
    getSingleTurf, turfInfo}) => {
    
  return (
    <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-lg sora font-semibold mb-3">
            Select Check-in Time
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {filteredCheckinTimes?.map((slot, idx) => {
              const isBooked = turfInfo?.bookedSlots
                ?.find(s => s.date === selectedDate.toISOString().split('T')[0])
                ?.slots?.some(b => b.start === slot.military);
               
              const isAvailable = availableTimes.includes(slot.display);

              return (
                <div
                  key={idx}
                  onClick={() => isAvailable && handleCheckIn(slot.display)}
                  className={`px-4 py-3 rounded-lg text-center border transition ${selectedCheckIn === slot.display
                    ? "bg-green-500 text-black border-green-500"
                    : isBooked
                      ? "bg-red-600 text-white border-red-700"
                      : isAvailable
                        ? "bg-[#1a1a1a] text-white border-[#2a2a2a]"
                        : "bg-gray-800 text-gray-400 border-gray-600 cursor-not-allowed"
                    }`}
                >
                  {slot.display}
                </div>
              );
            })}
          </div>
        </motion.div>
  )
}

export default SelectCheckIn
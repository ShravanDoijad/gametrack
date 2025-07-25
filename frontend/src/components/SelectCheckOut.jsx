import React, { useState } from "react";
import { motion, time } from "framer-motion";
import { CalendarDays, Calendar, Clock3 } from "lucide-react";

const SelectCheckOut = ({getFilteredCheckoutTimes, selectedCheckOut, handleCheckOut}) => {
  return (
    <motion.div
              className="mt-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-lg sora font-semibold mb-3">
                Select Check-out Time
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {getFilteredCheckoutTimes()
                  .map((time, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleCheckOut(time)}
                      className={`px-4 py-3 rounded-lg cursor-pointer text-center border transition ${selectedCheckOut === time
                        ? "bg-yellow-500 text-black border-yellow-500"
                        : "bg-[#1a1a1a] text-white border-[#2a2a2a]"
                        }`}
                    >
                      {time}
                    </div>
                  ))}
              </div>
            </motion.div>
  )
}

export default SelectCheckOut
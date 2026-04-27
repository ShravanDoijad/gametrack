import React from 'react'
import { motion } from 'framer-motion'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";
import { CalendarDays, Calendar, Clock3 } from "lucide-react";

const DatePick = ({next7Days, handleDateSelect, selectedDate, showCalendar, setShowCalendar, customDate }) => {
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth()+4)
  return (
    <>
    <div className="flex gap-3 flex-wrap pb-2">
            {next7Days.map((day, idx) => (
              <motion.div
                key={idx}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDateSelect(day.date)}
                className={`min-w-[90px] p-3 rounded-2xl text-center cursor-pointer border transition-all duration-300 shadow-sm ${selectedDate?.toDateString() === day.date.toDateString()
                  ? "bg-lime-400 text-gray-950 border-lime-400 shadow-[0_0_20px_rgba(163,230,53,0.3)] transform scale-105"
                  : "bg-white/5 backdrop-blur-md border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20"
                  }`}
              >
                <p className={`text-xs font-medium mb-1 uppercase tracking-wider ${selectedDate?.toDateString() === day.date.toDateString() ? "text-gray-800" : "text-gray-400"}`}>{day.label.split(",")[0]}</p>
                <p className="text-xl font-extrabold">{day.label.split(",")[1]}</p>
              </motion.div>
            ))}
    
            <motion.div
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCalendar(true)}
              className="min-w-[90px] p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center text-gray-300"
            >
              <CalendarDays className="mb-2 text-lime-400" size={24} />
              <p className="text-xs font-semibold tracking-wide uppercase">Pick Date</p>
            </motion.div>
          </div>
    
          {showCalendar && (
            <div className="my-4 bg-gray-900/80 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-2xl flex justify-center">
              <DatePicker
                selected={customDate}
                onChange={(date) => handleDateSelect(date)}
                inline
                minDate={new Date()}
                maxDate={maxDate}
              />
            </div>
          )}
    </>
  )
}

export default DatePick
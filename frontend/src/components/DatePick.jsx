import React from 'react'
import { motion } from 'framer-motion'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";
import { CalendarDays, Calendar, Clock3 } from "lucide-react";

const DatePick = ({next7Days, handleDateSelect, selectedDate, showCalendar, setShowCalendar }) => {
  return (
    <>
    <div className="flex gap-3 flex-wrap pb-2">
            {next7Days.map((day, idx) => (
              <motion.div
                key={idx}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDateSelect(day.date)}
                className={`min-w-[90px] p-3 rounded-xl text-center cursor-pointer border transition-all duration-200 ${selectedDate?.toDateString() === day.date.toDateString()
                  ? "bg-lime-500 text-black border-lime-500"
                  : "bg-[#1a1a1a] border-[#2a2a2a] text-white"
                  }`}
              >
                <p className="text-sm font-semibold">{day.label.split(",")[0]}</p>
                <p className="text-lg font-bold sora">{day.label.split(",")[1]}</p>
              </motion.div>
            ))}
    
            <motion.div
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCalendar(true)}
              className="min-w-[90px] p-3 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-center cursor-pointer"
            >
              <CalendarDays className="mx-auto mb-1" />
              <p className="text-xs">Pick Date</p>
            </motion.div>
          </div>
    
          {showCalendar && (
            <div className="my-4 bg-[#1a1a1a] p-4 rounded-xl border border-gray-700">
              <DatePicker
                selected={customDate}
                onChange={(date) => handleDateSelect(date)}
                inline
                minDate={new Date()}
                maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
              />
            </div>
          )}
    </>
  )
}

export default DatePick
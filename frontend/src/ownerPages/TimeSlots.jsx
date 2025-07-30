import React, { useState, useEffect, useContext } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { AlertTriangle, PlusCircle, Loader2, CalendarDays, Calendar, Clock3 } from "lucide-react";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";
import { addDays, format } from "date-fns";
import { motion } from "framer-motion";
import axios from "axios";
import { BookContext } from "../constexts/bookContext";
import { toast } from "react-toastify";
import SelectCheckOut from "../components/SelectCheckOut";
import SelectCheckIn from "../components/SelectCheckIn";

const getNext7Days = () => {
  const days = [];
  const options = { weekday: "short", month: "short", day: "numeric" };
  for (let i = 0; i < 7; i++) {
    const today = new Date();
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    days.push({
      label: date.toLocaleDateString("en-US", options),
      date,
    });
  }

  return days;
};

const TimeSlots = () => {

  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmingSlot, setConfirmingSlot] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const [manualSlotModal, setManualSlotModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedCheckIn, setSelectedCheckIn] = useState(null);


  const [showSlotPopup, setShowSlotPopup] = useState(false);

  const { selectedTurfId, turfs } = useContext(BookContext);
  

    const [availableCheckoutSlots, setavailableCheckoutSlots] = useState([])
    const [selectedCheckOut, setSelectedCheckOut] = useState(null);
    const [customDate, setCustomDate] = useState(null);
    const [availableTimes, setAvailableTimes] = useState([]);
    const [allSlots, setallSlots] = useState([])
    const [phone, setPhone] = useState("");
    const [advanceAmount, setAdvanceAmount] = useState("");

   

  const next7Days = getNext7Days();


 

  const handleDateSelect = (date) => {
    const timezoneAdjustedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12,
      0,
      0
    );

    setSelectedDate(timezoneAdjustedDate);
    setSelectedCheckIn(null);
    setSelectedCheckOut(null);
   
    setShowCalendar(false);
    setShowSlotPopup(true);
  };

  const handleCheckIn = (time) => {
    setSelectedCheckIn(time);
    setSelectedCheckOut(null);
    setShowSlotPopup(true);
  };

    const handleConfirming =(time) => {
    setConfirmingSlot({start:selectedCheckIn, end:time});
    
  }
  const handleCheckOut = (time) => {
    setSelectedCheckOut(time);
    setShowSlotPopup(false);
    handleConfirming(time)
  };


  
  let turfInfo;
    if(turfs.length>0){
      turfInfo=  turfs.find((turf)=>turf._id === selectedTurfId)
    }

  const calculateDuration = () => {
    const indexIn = allSlots.findIndex(s => s.display === selectedCheckIn);
    const indexOut = allSlots.findIndex(s => s.display === selectedCheckOut);
    return indexOut - indexIn;
  };

  const convertToMilitary = (timeStr) => {
    const [time, period] = timeStr.split(" ");
    let [hour, minute] = time.split(":").map(Number);

    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };
  const formattedDate = selectedDate?.toISOString().split('T')[0];
  console.log("cheOut", selectedCheckOut)
  const handleManualBooking = async () => {
    try {
      await axios.patch(`/owner/update-status`, {
        turfId: selectedTurfId,
        date: formattedDate,
        start: selectedCheckIn,
        end: selectedCheckOut,
        newStatus: "booked",
      });
      setConfirmingSlot(null)
      setManualSlotModal(false);
      toast.success(`${selectedCheckIn}-${selectedCheckOut} slot is Booked`)
    } catch (err) {
      console.error("Failed to manually book slot:", err);
      toast.error(err.response.message || "Unable To update Slot")
    }
  };

   const generateAvailableTimeSlots = (selectedDate, turfInfo) => {
      const all = []
      const [openHour, openMinute] = turfInfo.openingTime.split(':').map(Number);
      const [closeHour, closeMinute] = turfInfo.closingTime.split(':').map(Number);
  
  
      let currentMinutes = openHour * 60 + openMinute;
      const closingMinutes = closeHour * 60 + closeMinute;
  
  
      while (currentMinutes <= closingMinutes) {
        const hour = Math.floor(currentMinutes / 60);
        const minute = currentMinutes % 60;
  
  
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const timeString = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  
  
        const militaryTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  
        all.push({
          display: timeString,
          military: militaryTime,
          hour: hour,
          minute: minute
        });
  
        currentMinutes += 30;
      }
  
      setallSlots(all)
  
      const today = new Date();
      const isToday = selectedDate &&
        selectedDate.getDate() === today.getDate() &&
        selectedDate.getMonth() === today.getMonth() &&
        selectedDate.getFullYear() === today.getFullYear();
  
      let filteredSlots = [...all];
  
  
      if (isToday) {
        const currentHour = today.getHours();
        const currentMinute = today.getMinutes();
  
        filteredSlots = all.filter(slot => {
  
  
  
          return slot.hour > currentHour ||
            (slot.hour === currentHour && slot.minute > currentMinute);
        });
      }
  
  
      if (!selectedDate) {
        return filteredSlots.map(slot => slot.display);
      }
  
  
      const dateStr = selectedDate.toISOString().split('T')[0];
    
  
  
      const bookedForDate = turfInfo.bookedSlots.find(slot => slot.date === dateStr);
  
  
  
      if (!bookedForDate) {
        setavailableCheckoutSlots(filteredSlots);
        return filteredSlots.map(slot => slot.display);
      }
  
      const timeStringToMinutes = time => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
      };
  
      const availableSlots = filteredSlots.filter(slot => {
        const slotTime = timeStringToMinutes(slot.military);
  
        return !bookedForDate.slots.some(bookedSlot => {
          const start = timeStringToMinutes(bookedSlot.start);
          const end = timeStringToMinutes(bookedSlot.end);
          return slotTime >= start && slotTime < end;
        });
      });
  
      console.log("✅ Available slots after filter:", availableSlots);
  
      setavailableCheckoutSlots(filteredSlots.filter(slot => {
        return !bookedForDate.slots.some(bookedSlot =>
          slot.military > bookedSlot.start && slot.military < bookedSlot.end
        );
      }))
      console.log("chcekout", filteredSlots.filter(slot => {
        return !bookedForDate.slots.some(bookedSlot =>
  
          slot.military > bookedSlot.start && slot.military < bookedSlot.end
        );
      }))
  
      return availableSlots.map(slot => slot.display);
    };
  
    useEffect(() => {
      if (selectedDate && turfInfo) {
        const slots = generateAvailableTimeSlots(selectedDate, turfInfo);
        setAvailableTimes(slots);
      }
    }, [selectedDate, selectedTurfId]);
  
  
  
  
    const getFilteredCheckoutTimes = () => {
      const checkInIndex = allSlots.findIndex(slot => slot.display === selectedCheckIn);
      let nextBookingIndex = allSlots.length;
  
      const dateStr = selectedDate.toISOString().split('T')[0];
      const bookedForDate = turfInfo.bookedSlots.find(slot => slot.date === dateStr);
  
      
  
  
      if (bookedForDate) {
        for (let slot of bookedForDate.slots) {
  
          const index = allSlots.findIndex(s => s.military === slot.start);
  
          if (index > checkInIndex) {
            nextBookingIndex = Math.min(nextBookingIndex, index);
          }
        }
      }
     
      return allSlots
        .slice(checkInIndex + 1, nextBookingIndex + 1)
        .filter(slot =>
          availableCheckoutSlots.find((time) => time.display === slot.display)
        )
        .map(slot => slot.display);
    };
    
     const filteredCheckinTimes = allSlots.filter(slot =>
    slot.military !== turfInfo.closingTime

  )
 

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




        {confirmingSlot && (
  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4 backdrop-blur-sm">
    <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-700 w-full max-w-md shadow-2xl">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 p-3 bg-amber-400/10 rounded-full">
          <AlertTriangle className="text-amber-400" size={40} />
        </div>
        <h3 className="text-xl font-bold text-white mb-3 sora">
          Confirm Slot Booking
        </h3>
        <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
          You're about to mark <span className="font-semibold text-white">{confirmingSlot.start} - {confirmingSlot.end}</span> as Booked.
          <br />
          <span className="text-green-400 mt-2 inline-block sora font-medium">
            This action can be shown to All Users
          </span>
        </p>

        {/* Inputs for phone and advance */}
        <div className="w-full mb-4 space-y-3">
          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-neutral-800 text-white border border-neutral-700 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-lime-500"
          />
          <input
            type="number"
            placeholder="Advance Amount (₹)"
            value={advanceAmount}
            onChange={(e) => setAdvanceAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-neutral-800 text-white border border-neutral-700 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-lime-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4 w-full">
          <button
            onClick={() => setConfirmingSlot(null)}
            className="flex-1 border border-neutral-700 px-4 py-3 text-neutral-300 rounded-lg hover:bg-neutral-800 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => handleManualBooking()}
            className="flex-1 bg-gradient-to-r from-lime-500 to-lime-600 text-black font-semibold px-4 py-3 rounded-lg hover:from-lime-400 hover:to-lime-500 transition-colors font-sora"
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  </div>
)}

        {manualSlotModal &&
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
        }


        {
          showCalendar && (
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

        {selectedDate && showSlotPopup && !selectedCheckIn && (
          <SelectCheckIn filteredCheckinTimes={filteredCheckinTimes} selectedCheckIn={selectedCheckIn}  selectedDate={selectedDate}  handleCheckIn={handleCheckIn} turfInfo={turfInfo} availableTimes={availableTimes}  />
        )}

        

        {selectedCheckIn && showSlotPopup && !selectedCheckOut && (
          <SelectCheckOut getFilteredCheckoutTimes={getFilteredCheckoutTimes}s selectedCheckIn={convertToMilitary(selectedCheckIn)} allSlots={allSlots} selectedDate={selectedDate} selectedCheckOut={selectedCheckOut} handleCheckOut={handleCheckOut}  />
        )}



      </div>
    </div>
  );
};

export default TimeSlots;
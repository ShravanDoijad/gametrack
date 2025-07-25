import React, { useState } from "react";
import { motion, time } from "framer-motion";
import { CalendarDays, Calendar, Clock3 } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useContext } from "react";
import { useEffect } from "react";
import { BookContext } from "../constexts/bookContext";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import SelectCheckIn from "../components/SelectCheckIn";
import SelectCheckOut from "../components/SelectCheckOut";
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
const BookingManager = () => {
  const { selectedSport, userInfo, } = useContext(BookContext)
  const location = useLocation()
  const navigate = useNavigate()
  const [turfInfo, setturfInfo] = useState()
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedCheckIn, setSelectedCheckIn] = useState(null);
  const [availableCheckoutSlots, setavailableCheckoutSlots] = useState([])
  const [selectedCheckOut, setSelectedCheckOut] = useState(null);
  const [customDate, setCustomDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSlotPopup, setShowSlotPopup] = useState(false);
  const [showFormPopup, setShowFormPopup] = useState(false);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [paymentOption, setPaymentOption] = useState(null);
  const [allSlots, setallSlots] = useState([])
  const [loading, setloading] = useState(false)


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
    setShowFormPopup(false);
    setShowCalendar(false);
    setShowSlotPopup(true);
  };

  const handleCheckIn = (time) => {
    setSelectedCheckIn(time);
    setSelectedCheckOut(null);
    setShowSlotPopup(true);
  };

  const handleCheckOut = (time) => {
    setSelectedCheckOut(time);
    setShowFormPopup(true);
    setShowSlotPopup(false);
  };

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

  const next7Days = getNext7Days();


  const handlePayment = async () => {
    try {
      const amount = 250;


      const bookingDetails = {
        turfId: turfInfo._id,
        userId: userInfo._id,
        date: selectedDate.toISOString().split('T')[0],
        slots: [{
          start: convertToMilitary(selectedCheckIn),
          end: convertToMilitary(selectedCheckOut)
        }],
        sport: selectedSport || turfInfo.sportsAvailable[0],
        amount: amount,
        slotFees: calculateFee(),
        paymentType: paymentOption,
        turfName: turfInfo.name,
        location: turfInfo.location,
        amenities: turfInfo.amenities,
        policies: turfInfo.onSitePolicies
      };

      setloading(true)

      const res = await axios.post("/api/users/createOrder", {
        amount: amount,
        currency: "INR",
        receipt: `booking_${Date.now()}`,

        bookingDetails: bookingDetails

      });

      const { order } = res.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: `${turfInfo.name} Booking`,
        description: `Booking for ${selectedSport || turfInfo.sportsAvailable[0]}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post("/api/users/verifyPayment", {
              userId: userInfo._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingDetails: bookingDetails,

            });
            if (verifyRes.data.success) {
              toast.success("Booking Confirmed!");
              setShowFormPopup(false)
              navigate("/")
            } else {
              toast.error("Payment Failed");
            }
          } catch (err) {
            console.error(err);
            toast.warning("Payment verification error");
          }
          finally {
            setloading(false)
          }
        },
        prefill: {
          name: userInfo.fullname,
          contact: userInfo.phone
        },
        theme: {
          color: "#00ff87",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.log(err);
      toast.error("Payment Error");
    }
    finally {
      setloading(false)
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

      currentMinutes += 60;
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
  }, [selectedDate, turfInfo]);

  const getSingleTurf = async (turfId) => {

    try {
      setloading(true)
      const res = await axios.get("/api/turfs/getSingleTurf", {
        params: { id: turfId }
      });
      setturfInfo(res.data.turf)
    } catch (error) {
      toast.error(res.data.message || "Internal server Error")
    }
    finally {
      setloading(false)


    }
  }

  useEffect(() => {

    const savedTurf = JSON.parse(localStorage.getItem("selectedTurf"));

    if (savedTurf) {
      getSingleTurf(savedTurf);
    }



  }, [])





  const getFilteredCheckoutTimes = () => {
    const checkInIndex = allSlots.findIndex(slot => slot.display === selectedCheckIn);
    let nextBookingIndex = allSlots.length;

    const dateStr = selectedDate.toISOString().split('T')[0];
    const bookedForDate = turfInfo.bookedSlots.find(slot => slot.date === dateStr);

    console.log("booked for date", bookedForDate);


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

  const getPriceForSlot = (turfInfo, checkInTime) => {

    const timeParts = checkInTime.split(/:| /);
    let hour = parseInt(timeParts[0]);
    const period = timeParts[2];

    // Convert to 24-hour format
    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }


    return hour >= 19 ? turfInfo.nightPrice : turfInfo.dayPrice;
  };

  // Then use it in your calculateFee:
  const calculateFee = () => {
    const pricePerHour = getPriceForSlot(turfInfo, selectedCheckIn);
    return calculateDuration() * pricePerHour;
  };

  const filteredCheckinTimes = allSlots.filter(slot =>
    slot.military !== turfInfo.closingTime

  )




  return (
    <div className="px-6 pb-24 text-white font-sans">
      <h2 className="font-bold text-2xl sora mb-4">Schedule Your Game</h2>
      {loading && (
        <div className="flex justify-center items-center min-h-[100px]">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

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

      {selectedDate && showSlotPopup && !selectedCheckIn && (
        <SelectCheckIn filteredCheckinTimes={filteredCheckinTimes} selectedCheckIn={selectedCheckIn} selectedDate={selectedDate} handleCheckIn={handleCheckIn} turfInfo={turfInfo._id} availableTimes={availableTimes} getSingleTurf={getSingleTurf} />
      )}

      {selectedCheckIn && showSlotPopup && !selectedCheckOut && (
        <SelectCheckOut getFilteredCheckoutTimes={getFilteredCheckoutTimes} selectedCheckOut={selectedCheckOut} handleCheckOut={handleCheckOut} />
      )}

      {showFormPopup && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex justify-center items-center bg-black/70 backdrop-blur-sm px-4"
        >
          <div className="w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl border border-gray-700 shadow-2xl font-sora relative overflow-hidden">

            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-500/10 rounded-full -ml-12 -mb-12"></div>

            <h2 className="text-2xl font-bold text-white mb-2 relative z-10">
              Confirm Your Booking
            </h2>
            <p className="text-sm text-gray-300 mb-6 relative z-10">
              {turfInfo.name}, {turfInfo.location.city}
            </p>

            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 mb-6 relative z-10">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <Calendar size={18} className="text-lime-400 mr-2" />
                  <div>
                    <p className="text-xs text-gray-400">Date</p>
                    <p className="font-medium text-white">
                      {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowFormPopup(false);
                    setShowCalendar(true);
                  }}
                  className="text-lime-400 hover:text-lime-300 text-xs bg-gray-700/50 px-2 py-1 rounded"
                >
                  Change
                </button>
              </div>

              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <Clock3 size={18} className="text-yellow-400 mr-2" />
                  <div>
                    <p className="text-xs text-gray-400">Time Slot</p>
                    <p className="font-medium text-white">
                      {selectedCheckIn} - {selectedCheckOut}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowFormPopup(false);
                    setShowSlotPopup(true);
                    setSelectedCheckOut(null);
                  }}
                  className="text-yellow-400 hover:text-yellow-300 text-xs bg-gray-700/50 px-2 py-1 rounded"
                >
                  Change
                </button>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Clock3 size={18} className="text-blue-400 mr-2" />
                  <div>
                    <p className="text-xs text-gray-400">Duration</p>
                    <p className="font-medium text-white">
                      {calculateDuration()} hour{calculateDuration() > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Price per hour</p>
                  {
                    <p className="font-medium text-white">
                      ₹{getPriceForSlot(turfInfo, selectedCheckIn)}
                    </p>
                  }
                </div>
              </div>
            </div>

            <div className="mb-6 relative z-10">
              <p className="font-semibold mb-3 text-white sora text-md">
                Select Payment Option
              </p>
              <div className="flex gap-3 flex-wrap">
                {turfInfo.allowAdvancePayment && (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPaymentOption("advance")}
                    className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${paymentOption === "advance"
                      ? "bg-gradient-to-r from-green-500 to-lime-500 text-black border-transparent shadow-lg"
                      : "bg-gray-800 text-white border-gray-600 hover:border-lime-400"
                      }`}
                  >
                    <div className="font-bold">Advance</div>
                    <div className="text-xs">₹ 250</div>
                  </motion.button>
                )}


              </div>

              {turfInfo.allowAdvancePayment && (

                <p className="text-xs text-gray-400 mt-2">
                  <span className=" font-bold text-md text-red-300 sora">Advance Non Refundable</span><br />
                  * Remaining amount to be paid at the venue
                </p>
              )}
            </div>

            {/* Important turf policies */}
            {turfInfo.onSitePolicies.length > 0 && (
              <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700 mb-6 relative z-10">
                <p className="text-xs text-gray-400 mb-1">Turf Policies:</p>
                <ul className="text-xs text-gray-300 space-y-1">
                  {turfInfo.onSitePolicies.map((policy, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-yellow-400 mr-1">•</span> {policy}
                    </li>
                  ))}
                </ul>
              </div>
            )}


            <motion.button
              whileHover={paymentOption ? { scale: 1.02 } : {}}
              whileTap={paymentOption ? { scale: 0.98 } : {}}
              disabled={!paymentOption}
              onClick={handlePayment}
              className={`relative z-10 w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${paymentOption
                ? "bg-gradient-to-r from-lime-500 to-green-500 text-black hover:shadow-lg hover:shadow-lime-500/20"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
            >
              {paymentOption === "advance" ? `Pay Advance (₹ 250)` :
                paymentOption === "full" ? `Pay Full (₹${calculateFee()})` :
                  "Select Payment Option"}
            </motion.button>


            <div className="absolute top-4 right-4 bg-gray-800/80 px-3 py-1 rounded-full text-xs font-medium border border-gray-600 text-lime-300 z-10">
              {selectedSport || turfInfo.sportsAvailable[0]}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );



}

export default BookingManager
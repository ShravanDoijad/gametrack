import React, { useState } from "react";
import { motion, time } from "framer-motion";
import { CalendarDays, Calendar, Clock3 } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useContext, useMemo } from "react";

import { useEffect } from "react";
import { BookContext } from "../constexts/bookContext";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import SelectCheckIn from "../components/SelectCheckIn";
import SelectCheckOut from "../components/SelectCheckOut";
import DatePick from "../components/DatePick";
import BookingConfirmationForm from "../components/BookingConfirmationForm";
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
  const [plan, setplan] = useState(location.state.plan);
  const [subscription, setsubscription] = useState()
  const isSubscription = plan?.days > 0;


  const timeStringToMinutes = time => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };


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
    const duration = ((timeStringToMinutes(convertToMilitary(selectedCheckOut)) - timeStringToMinutes(convertToMilitary(selectedCheckIn))) / 60).toFixed(1)
    return duration;
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
      const amount= 200* Math.floor(calculateDuration())


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
        duration: calculateDuration(),
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



  const calculateSubscriptionFee = () => {
  
    const hoursPerDay = calculateDuration();
   
    return hoursPerDay * plan?.amount;
  };

  const addSubscription = async () => {
    
    try {
      const amount = calculateSubscriptionFee();
      let advanceAmount = Math.round(amount * 0.2);
      advanceAmount = advanceAmount + advanceAmount * 0.0218
      const subscriptionDetails = {
        turfId: turfInfo._id,
        userId: userInfo._id,
        durationDays: parseInt(plan.days),
        fromDate: selectedDate.toISOString().split('T')[0],
        toDate: dateRange.end.toISOString().split('T')[0],
        slot: {
          start: convertToMilitary(selectedCheckIn),
          end: convertToMilitary(selectedCheckOut)
        },
        duration: calculateDuration(),
        sport: selectedSport || turfInfo.sportsAvailable[0],
        pricePerHour: getPriceForSlot(turfInfo, selectedCheckIn),
        totalAmount: amount,
        paymentType: paymentOption,
        advanceAmount: advanceAmount
      };

      setloading(true);
        const paymentRes = await axios.post("/api/users/createOrder", {
          amount: advanceAmount,
          currency: "INR",
          receipt: `subscription_advance_${Date.now()}`,
          subscriptionDetails: subscriptionDetails
        });
        console.log("paymentRes", paymentRes)
        
        const { order } = paymentRes.data;
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: "INR",
          name: `${turfInfo.name} Subscription (Advance)`,
          description: `Subscription advance for ${selectedSport || turfInfo.sportsAvailable[0]}`,
          order_id: order.id,
          handler: async function (response) {
            try {
              const verifyRes = await axios.post("/api/users/verifyPayment", {
                userId: userInfo._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                subscriptionDetails: subscriptionDetails,
              });
              if (verifyRes.data.success) {
                toast.success("Subscription Advance Paid!");
                setShowFormPopup(false);
                navigate("/subscriptions");
              } else {
                toast.error("Payment Failed");
              }
            } catch (err) {
              console.error(err);
              toast.warning("Payment verification error");
            } finally {
              setloading(false);
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
      
    } catch (error) {
      console.error("Handling Subscription Error: ", error);
      toast.error(error.response?.data?.message || "Internal server error");
      setloading(false);
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
      return res.data.turf;
    } catch (error) {
      toast.error(error.response?.data?.message || "Internal server Error")
    }
    finally {
      setloading(false)


    }
  }

  useEffect(() => {

    const savedTurf = localStorage.getItem("selectedTurf");
    console.log("saved Turf", savedTurf)

    if (savedTurf) {
      getSingleTurf(savedTurf);
    }



  }, [])

  // useEffect(async()=>{
  //   if(turfInfo.subscriptionSlots.length>0){
  //   try{

  //     const res = await axios.get("/api/users/getSubscription",{
  //       turfId:turfInfo._id
  //     })
  //     setsubscription(res.data.subscription)
  //   }
  //   catch(error){

  //     toast.error(error.response.data.message || "Internal Server Error")
  //   }}
  // }, [turfInfo])





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
    const switchTime = parseInt(turfInfo.nightPriceStart?.split(":")[0])

    return hour >= switchTime ? turfInfo.nightPrice : turfInfo.dayPrice;
  };

  const calculateFee = () => {
    const pricePerHour = getPriceForSlot(turfInfo, selectedCheckIn);
    return calculateDuration() * pricePerHour;
  };

  const filteredCheckinTimes = allSlots.filter(slot =>
    slot.military !== turfInfo.closingTime

  )
  const dateRange = useMemo(() => {
    if (!selectedDate || !plan?.days) return null;
    const endDate = new Date(selectedDate);
    endDate.setDate(endDate.getDate() + parseInt(plan.days) - 1);
    return {
      start: selectedDate,
      end: endDate
    };
  }, [selectedDate, plan?.days]);

  
  return (
    <div className="px-6 pb-24 text-white font-sans">
      <h2 className="font-bold text-2xl sora mb-4">Schedule Your Game</h2>
      {loading && (
        <div className="flex justify-center items-center min-h-[100px]">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <DatePick next7Days={next7Days} selectedDate={selectedDate} handleDateSelect={handleDateSelect} showCalendar={showCalendar}
        setShowCalendar={setShowCalendar} customDate={customDate} />

      {selectedDate && showSlotPopup && !selectedCheckIn && (
        <SelectCheckIn filteredCheckinTimes={filteredCheckinTimes} selectedCheckIn={selectedCheckIn} selectedDate={selectedDate} handleCheckIn={handleCheckIn} turfInfo={turfInfo._id} availableTimes={availableTimes} getSingleTurf={getSingleTurf} />
      )}

      {selectedCheckIn && showSlotPopup && !selectedCheckOut && (
        <SelectCheckOut selectedCheckIn={convertToMilitary(selectedCheckIn)} selectedCheckOut={selectedCheckOut} allSlots={allSlots} selectedDate={selectedDate} handleCheckOut={handleCheckOut} getSingleTurf={getSingleTurf} />
      )}

        {showFormPopup && (
        <BookingConfirmationForm 
          turfInfo={turfInfo}
          selectedDate={selectedDate}
          selectedCheckIn={selectedCheckIn}
          selectedCheckOut={selectedCheckOut}
          calculateDuration={calculateDuration}
          getPriceForSlot={getPriceForSlot}
          setShowFormPopup={setShowFormPopup}
          setShowCalendar={setShowCalendar}
          setShowSlotPopup={setShowSlotPopup}
          setSelectedCheckOut={setSelectedCheckOut}
          paymentOption={paymentOption}
          setPaymentOption={setPaymentOption}
          handlePayment={isSubscription ? addSubscription : handlePayment}
          selectedSport={selectedSport}
          calculateFee={isSubscription ? calculateSubscriptionFee : calculateFee}
          isSubscription={isSubscription}
        
          plan={plan}
          dateRange={dateRange}
        />
      )}
    </div>
  );



}

export default BookingManager
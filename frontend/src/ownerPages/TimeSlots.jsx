import { useState, useEffect, useContext } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { PlusCircle, CalendarDays } from "lucide-react";
import "react-time-picker/dist/TimePicker.css";
import { motion } from "framer-motion";
import axios from "axios";
import { BookContext } from "../constexts/bookContext";
import { toast } from "react-toastify";
import SelectCheckOut from "../components/SelectCheckOut";
import SelectCheckIn from "../components/SelectCheckIn";
import { useLocation, useNavigate } from "react-router-dom";

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
  const location = useLocation();

  const [confirmingSlot, setConfirmingSlot] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [manualSlotModal, setManualSlotModal] = useState(Boolean(location.state?.date));
  const [selectedDate, setSelectedDate] = useState(() => location.state?.date ? new Date(`${location.state.date}T12:00:00`) : null);
  const [selectedCheckIn, setSelectedCheckIn] = useState(() => {
    const startMinute = Number(location.state?.startTime);
    if (!Number.isFinite(startMinute)) return null;
    const hour = Math.floor(startMinute / 60) % 24;
    return `${hour % 12 || 12}:${String(startMinute % 60).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
  });
  const [showSlotPopup, setShowSlotPopup] = useState(Boolean(location.state?.startTime));
  const { selectedTurfId, turfs, setbookings, refreshOwnerData } = useContext(BookContext);
  const [availableCheckoutSlots, setavailableCheckoutSlots] = useState([])
  const [selectedCheckOut, setSelectedCheckOut] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [allSlots, setallSlots] = useState([])
  const [firstName, setfirstName] = useState("")
  const [lastName, setlastName] = useState("")
  const [phone, setPhone] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [paymentChoice, setPaymentChoice] = useState("unpaid");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sport, setSport] = useState("");
  const [bookingType, setBookingType] = useState("single");
  const [durationDays, setDurationDays] = useState(30);
  const [turfInfo, setturfInfo] = useState()
  const next7Days = getNext7Days();
  const navigate = useNavigate()
  const requestedDate = location.state?.date;
  const requestedStartTime = location.state?.startTime;

  useEffect(() => {
    const date = requestedDate;
    if (!date) return;
    setSelectedDate(new Date(`${date}T12:00:00`));
    setManualSlotModal(true);
    if (Number.isFinite(Number(requestedStartTime))) {
      const startMinute = Number(requestedStartTime);
      const hour = Math.floor(startMinute / 60) % 24;
      setSelectedCheckIn(`${hour % 12 || 12}:${String(startMinute % 60).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`);
      setShowSlotPopup(true);
    }
  }, [location.key, requestedDate, requestedStartTime]);


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

  const handleConfirming = (time) => {
    setConfirmingSlot({ start: selectedCheckIn, end: time });

  }
  const handleCheckOut = (time) => {
    setSelectedCheckOut(time);
    setShowSlotPopup(false);
    handleConfirming(time)
  };



  useEffect(() => {
    if (turfs.length > 0 && selectedTurfId) {
      const selectedTurf = turfs.find((turf) => turf._id === selectedTurfId);
      setturfInfo(selectedTurf);
    }
  }, [turfs, selectedTurfId]);


  const timeStringToMinutes = time => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };




  const convertToMilitary = (timeStr) => {
    if (!timeStr) return "00:00";
    const [time, period] = timeStr.split(" ");
    let [hour, minute] = time.split(":").map(Number);

    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

  const formattedDate = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
    : "";

  const calculateFee = () => {
    if (!turfInfo || !selectedCheckIn || !selectedCheckOut) return 0;
    const startMinute = timeStringToMinutes(convertToMilitary(selectedCheckIn));
    const endMinute = timeStringToMinutes(convertToMilitary(selectedCheckOut));
    if (endMinute <= startMinute) return 0;
    const cutoff = turfInfo.nightPriceStart ? timeStringToMinutes(turfInfo.nightPriceStart) : null;
    let amount = 0;
    for (let minute = startMinute; minute < endMinute; minute += 1) {
      const minuteOfDay = minute % 1440;
      const rate = cutoff !== null && minuteOfDay >= cutoff ? turfInfo.nightPrice : turfInfo.dayPrice;
      amount += Number(rate || 0) / 60;
    }
    return Math.round(amount * 100) / 100;
  };
  const money = (amount) => new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2,
  }).format(Number(amount) || 0);


  const handleManualBooking = async () => {
    if (isSubmitting) return;
    if (!firstName.trim() || !phone.trim()) {
      toast.error("Enter the customer’s name and mobile number.");
      return;
    }
    const total = bookingType === "subscription" ? calculateFee() * durationDays : calculateFee();
    const received = paymentChoice === "unpaid" ? 0 : paymentChoice === "full" ? total : Number(advanceAmount);
    if (!Number.isFinite(received) || received < 0 || received > total) {
      toast.error("The amount received must be between ₹0 and the booking total.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (bookingType === "single") {
        const response = await axios.post("/owner/addManualBooking", {
          fullname: `${firstName} ${lastName}`,
          phone: phone,
          advanceAmount: received,
          paymentMethod,
          date: formattedDate,
          start: convertToMilitary(selectedCheckIn),
          end: convertToMilitary(selectedCheckOut),
          turfId: selectedTurfId,
          slotFees: calculateFee(),
          newStatus: "booked"
        });
        if (response.data.booking) {
          setbookings((current) => [
            ...current.filter((booking) => booking._id !== response.data.booking._id),
            response.data.booking,
          ]);
        }
        await refreshOwnerData();
        toast.success(response.data.message || "Booking confirmed.");
      } else {
        const response = await axios.post("/owner/addManualSubscription", {
          fullname: `${firstName} ${lastName}`,
          phone: phone,
          advanceAmount: received,
          startDate: formattedDate,
          durationDays: durationDays,
          start: convertToMilitary(selectedCheckIn),
          end: convertToMilitary(selectedCheckOut),
          turfId: selectedTurfId,
          slotFees: calculateFee() * durationDays, // Assuming fee is per day
          sport: sport || "General",
          newStatus: "booked"
        });
        await refreshOwnerData();
        toast.success(response.data.message || "Subscription Created Successfully");
      }
      
      setConfirmingSlot(null);
      setManualSlotModal(false);
      setBookingType("single");
      setfirstName("");
      setlastName("");
      setPhone("");
      setAdvanceAmount("");
      setPaymentChoice("unpaid");
      setSport("");
      navigate("/owner/turfTodaysbookings");
    }
    catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "We couldn’t save this booking. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
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

  

    setavailableCheckoutSlots(filteredSlots.filter(slot => {
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
    <div className="min-h-full bg-slate-50 px-4 py-5 text-slate-900 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-sora sm:text-3xl">
              Add a booking
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Choose an available time and enter the customer details.
            </p>
          </div>
          <button
            onClick={() => setManualSlotModal(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#15803D] px-4 text-sm font-semibold text-white transition hover:bg-[#166534] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
          >
            <PlusCircle size={20} /> Add booking
          </button>
        </div>

        {confirmingSlot && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="presentation">
            <section role="dialog" aria-modal="true" aria-labelledby="manual-booking-title" className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl sm:rounded-3xl sm:p-7">
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Step 2 of 2 &middot; Confirm booking</p>
                  <h2 id="manual-booking-title" className="mt-1 text-xl font-bold">Customer and payment</h2>
                  <p className="mt-1 text-sm text-slate-600">Check the details before reserving this slot.</p>
                </div>
                <button type="button" aria-label="Close booking form" onClick={() => setConfirmingSlot(null)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">&times;</button>
              </div>

              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <span className="font-semibold">{selectedDate?.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span>
                  <span className="font-semibold">{selectedCheckIn} &ndash; {selectedCheckOut}</span>
                </div>
                <div className="mt-3 flex items-end justify-between gap-3 border-t border-emerald-100 pt-3">
                  <span className="text-sm text-slate-600">Total booking amount</span>
                  <span className="text-xl font-bold">{money(calculateFee() * (bookingType === "subscription" ? durationDays : 1))}</span>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-semibold">Customer name <span className="text-red-600">*</span>
                    <input autoComplete="name" value={firstName} onChange={(event) => setfirstName(event.target.value)} placeholder="Name" className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
                  </label>
                  <label className="block text-sm font-semibold">Mobile number <span className="text-red-600">*</span>
                    <input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Customer phone" className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
                  </label>
                </div>

                <div className="flex flex-wrap gap-2" role="group" aria-label="Booking type">
                  {[{ id: "single", label: "Single booking" }, { id: "subscription", label: "Subscription" }].map((item) => (
                    <button key={item.id} type="button" onClick={() => setBookingType(item.id)} aria-pressed={bookingType === item.id} className={`min-h-11 rounded-xl border px-4 text-sm font-semibold ${bookingType === item.id ? "border-emerald-800 bg-emerald-800 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>{item.label}</button>
                  ))}
                </div>
                {bookingType === "subscription" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-semibold">Subscription length
                      <select value={durationDays} onChange={(event) => setDurationDays(Number(event.target.value))} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100">
                        <option value={7}>7 days</option><option value={15}>15 days</option><option value={30}>30 days</option><option value={60}>60 days</option><option value={90}>90 days</option>
                      </select>
                    </label>
                    <label className="block text-sm font-semibold">Sport
                      <input value={sport} onChange={(event) => setSport(event.target.value)} placeholder="e.g. Football" className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
                    </label>
                  </div>
                )}

                <fieldset>
                  <legend className="mb-2 text-sm font-semibold">Payment received</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ id: "unpaid", label: "Not paid" }, { id: "partial", label: "Advance" }, { id: "full", label: "Fully paid" }].map((item) => (
                      <button key={item.id} type="button" onClick={() => { setPaymentChoice(item.id); if (item.id === "full") setAdvanceAmount(String(calculateFee() * (bookingType === "subscription" ? durationDays : 1))); if (item.id === "unpaid") setAdvanceAmount("0"); if (item.id === "partial") setAdvanceAmount(""); }} aria-pressed={paymentChoice === item.id} className={`min-h-11 rounded-xl border px-2 text-xs font-semibold sm:text-sm ${paymentChoice === item.id ? "border-emerald-800 bg-emerald-50 text-emerald-900" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>{item.label}</button>
                    ))}
                  </div>
                </fieldset>

                {paymentChoice === "partial" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-semibold">Amount received
                      <input type="number" min="0.01" max={calculateFee() * (bookingType === "subscription" ? durationDays : 1)} step="0.01" value={advanceAmount} onChange={(event) => setAdvanceAmount(event.target.value)} placeholder="Enter amount" className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
                    </label>
                    <label className="block text-sm font-semibold">Payment method
                      <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"><option value="cash">Cash</option><option value="upi">UPI</option><option value="other">Other</option></select>
                    </label>
                  </div>
                )}
                {paymentChoice === "full" && (
                  <label className="block max-w-sm text-sm font-semibold">Payment method
                    <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"><option value="cash">Cash</option><option value="upi">UPI</option><option value="other">Other</option></select>
                  </label>
                )}
                <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm"><span className="text-slate-600">Still due</span><strong>{money(Math.max(0, calculateFee() * (bookingType === "subscription" ? durationDays : 1) - (paymentChoice === "unpaid" ? 0 : paymentChoice === "full" ? calculateFee() * (bookingType === "subscription" ? durationDays : 1) : Number(advanceAmount) || 0)))}</strong></div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setConfirmingSlot(null)} className="min-h-11 rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Back</button>
                <button type="button" onClick={handleManualBooking} disabled={isSubmitting || !firstName.trim() || !phone.trim() || (paymentChoice === "partial" && !(Number(advanceAmount) > 0))} className="min-h-11 rounded-xl bg-emerald-800 px-5 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "Saving booking…" : "Confirm booking"}</button>
              </div>
            </section>
          </div>
        )}

        {manualSlotModal &&
          <div className="flex gap-3 flex-wrap pb-2">
            {next7Days.map((day, idx) => (
              <motion.button
                type="button"
                key={idx}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDateSelect(day.date)}
                className={`min-h-[76px] min-w-[100px] rounded-xl border p-3 text-center transition-colors ${selectedDate?.toDateString() === day.date.toDateString()
                  ? "border-green-800 bg-green-800 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-green-700 hover:bg-green-50"
                  }`}
              >
                <p className="text-sm font-semibold">{day.label.split(",")[0]}</p>
                <p className="text-lg font-bold sora">{day.label.split(",")[1]}</p>
              </motion.button>
            ))}

            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCalendar(true)}
              className="min-h-[76px] min-w-[100px] rounded-xl border border-slate-200 bg-white p-3 text-center text-slate-700 hover:border-green-700 hover:bg-green-50"
            >
              <CalendarDays className="mx-auto mb-1" />
              <p className="text-xs">Pick Date</p>
            </motion.button>
          </div>
        }


        {
          showCalendar && (
            <div className="my-4 overflow-x-auto rounded-xl border border-slate-200 bg-white p-4">
              <DatePicker
                selected={selectedDate}
                onChange={(date) => handleDateSelect(date)}
                inline
                minDate={new Date()}
                maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
              />
            </div>
          )}

        {selectedDate && showSlotPopup && !selectedCheckIn && (
          <SelectCheckIn filteredCheckinTimes={filteredCheckinTimes} selectedCheckIn={selectedCheckIn} selectedDate={selectedDate} handleCheckIn={handleCheckIn} turfInfo={turfInfo} availableTimes={availableTimes} />
        )}



        {selectedCheckIn && showSlotPopup && !selectedCheckOut && (
          <SelectCheckOut getFilteredCheckoutTimes={getFilteredCheckoutTimes} s selectedCheckIn={convertToMilitary(selectedCheckIn)} allSlots={allSlots} selectedDate={selectedDate} selectedCheckOut={selectedCheckOut} handleCheckOut={handleCheckOut} turfInfo={turfInfo} />
        )}



      </div>
    </div>
  );
};

export default TimeSlots;

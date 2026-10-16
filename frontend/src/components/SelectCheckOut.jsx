import { motion } from "framer-motion";
const SelectCheckOut = ({
  selectedCheckOut,
  selectedCheckIn,
  handleCheckOut,
  allSlots,
  selectedDate,
  turfInfo
}) => {

  const timeStringToMinutes = time => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const getFilteredCheckoutTimes = () => {
    if (!turfInfo) return [];

    const checkInIndex = allSlots.findIndex(
      (slot) => slot.military === selectedCheckIn
    );

    let nextBookingIndex = allSlots.length;
    const maxCheckoutIndex = checkInIndex + 8;

    const dateStr = selectedDate.toISOString().split("T")[0];
    const bookedForDate = turfInfo.bookedSlots?.find(
      (slot) => slot.date === dateStr
    );

    if (bookedForDate) {
      for (let slot of bookedForDate.slots) {
        const index = allSlots.findIndex((s) => s.military === slot.start);
        if (index > checkInIndex) {
          nextBookingIndex = Math.min(nextBookingIndex, index, maxCheckoutIndex);
        }
      }
    } else {
      nextBookingIndex = Math.min(nextBookingIndex, maxCheckoutIndex);
    }
    return allSlots.slice(checkInIndex + 2, nextBookingIndex + 1).map((slot) => ({
      display: slot.display,
      duration: ((timeStringToMinutes(slot.military) - timeStringToMinutes(selectedCheckIn)) / 60).toFixed(1),
    }));
  };
  return (
    <motion.div
      className="mt-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h3 className="mb-4 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
        Select an end time
      </h3>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {turfInfo &&
          getFilteredCheckoutTimes().map((slot, idx) => (
            <motion.button
              type="button"
              key={idx}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCheckOut(slot.display)}
              className={`min-h-24 rounded-xl border p-3 text-center transition-colors ${selectedCheckOut === slot.display
                  ? "bg-green-800 text-white border-green-800"
                  : "bg-white text-slate-700 border-slate-200 hover:border-green-700 hover:bg-green-50"
                }`}
            >
              <div className="flex flex-col items-center justify-center w-full">
                <span className={`text-sm font-bold tracking-wide uppercase ${selectedCheckOut === slot.display ? 'text-green-100' : 'text-green-800'}`}>
                  {slot.duration} hour{slot.duration > 1 ? "s" : ""}
                </span>
                
                <div className={`mt-2 mb-2 h-0.5 w-12 rounded-full ${selectedCheckOut === slot.display ? 'bg-white/30' : 'bg-slate-200'}`}></div>

                <div className="text-base font-bold tracking-tight">
                  {slot.display}
                </div>
              </div>
            </motion.button>
          ))}
      </div>
    </motion.div>
  );
};

export default SelectCheckOut;

import { motion } from "framer-motion";
import { Calendar, Clock3 } from "lucide-react";
import { useEffect } from "react";

const BookingConfirmationForm = ({
  turfInfo,
  selectedDate,
  selectedCheckIn,
  selectedCheckOut,
  calculateDuration,
  getPriceForSlot,
  setShowFormPopup,
  setShowCalendar,
  setShowSlotPopup,
  setSelectedCheckOut,
  paymentOption,
  setPaymentOption,
  handlePayment,
  selectedSport,
  calculateFee,
  isSubscription,
  plan,
  addSubscription,
  
  dateRange
}) => {

  const calculateSubscriptionFee = () => {
    const hoursPerDay = calculateDuration();
    return hoursPerDay * plan?.amount;
  };

 const calculateAdvanceAmount = () => {
  const totalAmount = isSubscription ? calculateSubscriptionFee() : calculateFee();
  return isSubscription
    ? Math.round(totalAmount * 0.2)
    :parseInt( Math.round(totalAmount*0.2)* Math.floor(calculateDuration()))
};


  const calculatePlatformFees = () => {
    if (!isSubscription) return 0;
    return Math.round(calculateAdvanceAmount() * 0.0218);
  };

  const getTotalPayableAmount = () => {
    const advance = calculateAdvanceAmount();
    return isSubscription ? advance + calculatePlatformFees() : advance;
  };
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  useEffect(() => {
    setPaymentOption("advance");
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
      className="fixed inset-0 z-50 flex justify-center items-center bg-gray-950/80 backdrop-blur-md px-4"
    >
      <div className="w-full max-w-md bg-gray-900/60 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] font-sans relative overflow-y-auto max-h-[90vh]">
        {/* Reduced decorative elements size */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-lime-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl -ml-8 -mb-8 pointer-events-none"></div>

        <div className="relative z-10">
          <h2 className="text-2xl font-extrabold text-white mb-1 tracking-tight">
            {isSubscription ? "Confirm Subscription" : "Confirm Booking"}
          </h2>
          <p className="text-sm font-medium text-gray-400 mb-5">
            {turfInfo.name}, {turfInfo.location.city}
          </p>

          {/* Compact booking details section */}
          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 mb-4 shadow-inner">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-lime-400/10 rounded-lg border border-lime-400/20">
                  <Calendar size={18} className="text-lime-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    {isSubscription ? "Date Range" : "Date"}
                  </p>
                  <p className="text-sm font-bold text-white">
                    {formatDate(selectedDate)}
                    {isSubscription && dateRange?.end && (
                      <span className="mx-1">to {formatDate(dateRange.end)}</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowFormPopup(false);
                  setShowCalendar(true);
                }}
                className="text-lime-400 hover:text-lime-300 text-xs font-bold bg-lime-400/10 hover:bg-lime-400/20 transition-colors px-3 py-1.5 rounded-lg border border-lime-400/20"
              >
                Change
              </button>
            </div>

            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-400/10 rounded-lg border border-amber-400/20">
                  <Clock3 size={18} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Time Slot</p>
                  <p className="text-sm font-bold text-white">
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
                className="text-amber-400 hover:text-amber-300 text-xs font-bold bg-amber-400/10 hover:bg-amber-400/20 transition-colors px-3 py-1.5 rounded-lg border border-amber-400/20"
              >
                Change
              </button>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-white/5">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-400/10 rounded-lg border border-blue-400/20">
                  <Clock3 size={18} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    {isSubscription ? "Duration" : "Duration"}
                  </p>
                  <p className="text-sm font-bold text-white">
                    {isSubscription 
                      ? `${plan.days}d - ${calculateDuration()}h` 
                      : `${calculateDuration()}h`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  {isSubscription ? "Total" : "Price/h"}
                </p>
                <p className="text-sm font-bold text-white">
                  ₹{isSubscription ? calculateSubscriptionFee() : getPriceForSlot(turfInfo, selectedCheckIn)}
                </p>
              </div>
            </div>
          </div>

          {/* Compact price summary */}
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 mb-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">
                  {isSubscription ? "Daily Price:" : "Total:"}
                </span>
                <span className="font-bold text-white">
                  ₹{calculateFee()}
                </span>
              </div>
              
              {isSubscription && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Days:</span>
                    <span className="font-bold text-white">{plan.days}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Advance:</span>
                    <span className="font-bold text-white">₹{calculateAdvanceAmount()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Platform Fees (2.18%):</span>
                    <span className="font-bold text-white">₹{calculatePlatformFees()}</span>
                  </div>
                </>
              )}
              
              <div className="flex justify-between pt-3 border-t border-white/10">
                <span className="font-extrabold text-white text-lg">
                  Pay Now:
                </span>
                <span className="text-xl font-extrabold text-lime-400 drop-shadow-[0_0_10px_rgba(163,230,53,0.3)]">
                  ₹{getTotalPayableAmount()}
                </span>
              </div>
            </div>
          </div>

          {/* Policies with reduced spacing */}
          {turfInfo.onSitePolicies.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/5 mb-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Turf Policies:</p>
              <ul className="text-xs font-medium text-gray-400 space-y-1.5">
                {turfInfo.onSitePolicies.map((policy, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-amber-400 mr-2 mt-0.5 text-[10px]">●</span> 
                    <span className="text-xs leading-relaxed">{policy}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={()=>handlePayment()}
            className="w-full py-3.5 rounded-2xl font-bold text-lg bg-lime-400 text-gray-950 shadow-[0_0_20px_rgba(163,230,53,0.3)] hover:shadow-[0_0_30px_rgba(163,230,53,0.5)] transition-all duration-300"
          >
            Pay Advance (₹{getTotalPayableAmount()})
          </motion.button>
        </div>

        <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/20 text-lime-400 z-10 shadow-sm">
          {selectedSport || turfInfo.sportsAvailable[0]}
        </div>
      </div>
    </motion.div>
  );
};

export default BookingConfirmationForm;
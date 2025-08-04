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

    console.log("issubscribed", isSubscription)
  const calculateSubscriptionFee = () => {
    const hoursPerDay = calculateDuration();
    return hoursPerDay * plan?.amount;
  };

 const calculateAdvanceAmount = () => {
  const totalAmount = isSubscription ? calculateSubscriptionFee() : calculateFee();
  return isSubscription
    ? Math.round(totalAmount * 0.2)
    : 200 * Math.floor(calculateDuration());
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
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex justify-center items-center bg-black/70 backdrop-blur-sm px-4"
    >
      <div className="w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-800 p-4 rounded-2xl border border-gray-700 shadow-2xl font-sora relative overflow-y-auto max-h-[90vh]">
        {/* Reduced decorative elements size */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full -mr-12 -mt-12"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-yellow-500/10 rounded-full -ml-8 -mb-8"></div>

        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white mb-1">
            {isSubscription ? "Confirm Subscription" : "Confirm Booking"}
          </h2>
          <p className="text-xs text-gray-300 mb-4">
            {turfInfo.name}, {turfInfo.location.city}
          </p>

          {/* Compact booking details section */}
          <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700 mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center space-x-2">
                <Calendar size={16} className="text-lime-400" />
                <div>
                  <p className="text-xs text-gray-400">
                    {isSubscription ? "Date Range" : "Date"}
                  </p>
                  <p className="text-sm font-medium text-white">
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
                className="text-lime-400 hover:text-lime-300 text-xs bg-gray-700/50 px-2 py-1 rounded"
              >
                Change
              </button>
            </div>

            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center space-x-2">
                <Clock3 size={16} className="text-yellow-400" />
                <div>
                  <p className="text-xs text-gray-400">Time Slot</p>
                  <p className="text-sm font-medium text-white">
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
              <div className="flex items-center space-x-2">
                <Clock3 size={16} className="text-blue-400" />
                <div>
                  <p className="text-xs text-gray-400">
                    {isSubscription ? "Duration" : "Duration"}
                  </p>
                  <p className="text-sm font-medium text-white">
                    {isSubscription 
                      ? `${plan.days}d - ${calculateDuration()}h` 
                      : `${calculateDuration()}h`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">
                  {isSubscription ? "Total" : "Price/h"}
                </p>
                <p className="text-sm font-medium text-white">
                  ₹{isSubscription ? calculateSubscriptionFee() : getPriceForSlot(turfInfo, selectedCheckIn)}
                </p>
              </div>
            </div>
          </div>

          {/* Compact price summary */}
          <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700 mb-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">
                  {isSubscription ? "Daily Price:" : "Price/h:"}
                </span>
                <span className="font-medium text-white">
                  ₹{getPriceForSlot(turfInfo, selectedCheckIn)}
                </span>
              </div>
              
              {isSubscription && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Days:</span>
                    <span className="font-medium text-white">{plan.days}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Advance (20%):</span>
                    <span className="font-medium text-white">₹{calculateAdvanceAmount()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Platform Fees (2.18%):</span>
                    <span className="font-medium text-white">₹{calculatePlatformFees()}</span>
                  </div>
                </>
              )}
              
              <div className="flex justify-between pt-2 border-t border-gray-700">
                <span className="font-semibold text-white">
                  Pay Now:
                </span>
                <span className="text-lg font-bold text-green-400">
                  ₹{getTotalPayableAmount()}
                </span>
              </div>
            </div>
          </div>

          {/* Policies with reduced spacing */}
          {turfInfo.onSitePolicies.length > 0 && (
            <div className="bg-gray-800/30 p-2 rounded-lg border border-gray-700 mb-4">
              <p className="text-xs text-gray-400 mb-1">Turf Policies:</p>
              <ul className="text-xs text-gray-300 space-y-0.5">
                {turfInfo.onSitePolicies.map((policy, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-yellow-400 mr-1">•</span> 
                    <span className="text-xs">{policy}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={()=>handlePayment()}
            className="w-full py-3 rounded-xl font-bold text-md bg-gradient-to-r from-green-500 to-lime-500 text-black hover:shadow-lg hover:shadow-lime-500/20"
          >
            Pay Advance (₹{getTotalPayableAmount()})
          </motion.button>
        </div>

        <div className="absolute top-3 right-3 bg-gray-800/80 px-2 py-0.5 rounded-full text-xs font-medium border border-gray-600 text-lime-300 z-10">
          {selectedSport || turfInfo.sportsAvailable[0]}
        </div>
      </div>
    </motion.div>
  );
};

export default BookingConfirmationForm;
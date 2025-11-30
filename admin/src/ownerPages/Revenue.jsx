import React, { useState, useEffect, useContext } from "react";
import { BookContext } from "../constexts/bookContext";
import moment from "moment";
import { CalendarDays, Wallet, Clock4, Banknote, Smartphone, HandCoins } from "lucide-react";

const Revenue = () => {
  const { bookings } = useContext(BookContext);
  console.log("Bookings in Revenue:", bookings);

  const [selectedPaymentMode, setSelectedPaymentMode] = useState("all"); // manual | online | all
  const [selectedTab, setSelectedTab] = useState("total");

  const [advanceRevenue, setAdvanceRevenue] = useState(0);
  const [fullRevenue, setFullRevenue] = useState(0);
  const [fieldEstimate, setFieldEstimate] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const tabs = [
    { id: "total", label: "Total", icon: <Wallet size={16} /> },
    { id: "today", label: "Today", icon: <CalendarDays size={16} /> },
    { id: "month", label: "This Month", icon: <Clock4 size={16} /> },
  ];

  useEffect(() => {
    const today = moment().format("YYYY-MM-DD");
    const thisMonth = moment().format("YYYY-MM");

    // 🔹 Step 1: Filter by payment mode
    let filtered = bookings;
    if (selectedPaymentMode !== "all") {
      filtered = filtered.filter(b => b.paymentType === selectedPaymentMode);     
    }

    // 🔹 Step 2: Apply tab filter
    if (selectedTab === "today") {
      filtered = filtered.filter(b => b.date === today);
    } else if (selectedTab === "month") {
      filtered = filtered.filter(b => b.date.startsWith(thisMonth));
    }

    // 🔹 Step 3: Calculate
    let advance = 0, full = 0, estimate = 0;
    filtered.forEach(booking => {
      if (booking.paymentType === "advance") {
        advance += booking.amountPaid || 0;
        estimate += booking.slotFees - (booking.amountPaid || 0);
      }
      else if(booking.paymentType === "Manual") {
        advance += booking.amountPaid || 0; 
        estimate += booking.slotFees - (booking.amountPaid || 0);

      }

    
      
    });
    setAdvanceRevenue(advance);
    setFullRevenue(full);
    setFieldEstimate(estimate);
    setTotalRevenue(advance + full + estimate);
  }, [selectedTab, selectedPaymentMode, bookings]);

  return (
    <div className="min-h-screen w-full bg-black text-white p-6">
       <h1 className="text-2xl sm:text-4xl font-extrabold text-center mb-4">
          Revenue Dashboard
        </h1>
      <div className="w-full max-w-6xl mx-auto space-y-8">

        <div className="flex justify-center gap-3 ">
          {[
            { id: "all", label: "All", icon: <Wallet size={18} /> },
            { id: "Manual", label: "Manual", icon: <HandCoins size={18} /> },
            { id: "advance", label: "Online", icon: <Smartphone size={18} /> },
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setSelectedPaymentMode(mode.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition text-sm font-medium
                ${selectedPaymentMode === mode.id
                  ? "bg-lime-600 text-white border-lime-700 shadow-lg"
                  : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
                }`}
            >
              {mode.icon}
              {mode.label}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-3 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full border transition text-sm
                ${selectedTab === tab.id
                  ? "bg-lime-500/20 border-lime-500 text-lime-400"
                  : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Total Revenue Big Card */}
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl shadow-xl p-6 text-center">
          <p className="text-gray-400 text-sm">
            Total Revenue (Advance + Full + Estimate)
          </p>
          <h2 className="text-4xl font-extrabold text-lime-400 mt-2">
            ₹{totalRevenue.toLocaleString()}
          </h2>
        </div>

        {/* Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="bg-gray-800/80 border border-gray-700 rounded-xl shadow p-5 space-y-2">
            <p className="text-gray-400 text-sm flex items-center gap-2">
              <Banknote size={16} className="text-blue-400" /> Advance Payments
            </p>
            <h2 className="text-2xl font-semibold text-blue-400">
              ₹{advanceRevenue.toLocaleString()}
            </h2>
          </div>

          <div className="bg-gray-800/80 border border-gray-700 rounded-xl shadow p-5 space-y-2">
            <p className="text-gray-400 text-sm flex items-center gap-2">
              <Wallet size={16} className="text-green-400" /> Full Payments
            </p>
            <h2 className="text-2xl font-semibold text-green-400">
              ₹{fullRevenue.toLocaleString()}
            </h2>
          </div>

          <div className="bg-gray-800/80 border border-gray-700 rounded-xl shadow p-5 space-y-2">
            <p className="text-gray-400 text-sm flex items-center gap-2">
              <Clock4 size={16} className="text-yellow-400" /> Pending Estimate
            </p>
            <h2 className="text-2xl font-semibold text-yellow-400">
              ₹{fieldEstimate.toLocaleString()}
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Revenue;

import React, { useState, useEffect, useContext } from 'react';
import { BookContext } from '../constexts/bookContext';
import moment from 'moment';
import { CalendarDays, Wallet, Clock4, Banknote } from 'lucide-react';

const Revenue = () => {
  const { bookings } = useContext(BookContext);
  const [selectedTab, setSelectedTab] = useState('total');

  const [advanceRevenue, setAdvanceRevenue] = useState(0);
  const [fullRevenue, setFullRevenue] = useState(0);
  const [fieldEstimate, setFieldEstimate] = useState(0);
  const [payoutDone, setPayoutDone] = useState(0);
  const [pendingPayout, setPendingPayout] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const tabs = [
    { id: 'total', label: 'Total Revenue', icon: <Wallet size={16} /> },
    { id: 'today', label: "Today's Revenue", icon: <CalendarDays size={16} /> },
    { id: 'month', label: "This Month", icon: <Clock4 size={16} /> },
  ];

  useEffect(() => {
    const today = moment().format('YYYY-MM-DD');
    const thisMonth = moment().format('YYYY-MM');

    let filtered = bookings;
    if (selectedTab === 'today') filtered = bookings.filter(b => b.date === today);
    else if (selectedTab === 'month') filtered = bookings.filter(b => b.date.startsWith(thisMonth));

    let advance = 0, full = 0, estimate = 0, payout = 0, pending = 0;

    filtered.forEach(b => {
      if (b.paymentType === 'advance') advance += b.amountPaid;
      if (b.paymentType === 'full') full += b.amountPaid;

      if (b.slots && b.slots.length > 0) {
    
        const rate = b.slotFees ;
        estimate += (rate - b.amountPaid);
      }
    });



    const twoDaysAgo = moment().subtract(2, 'days').format('YYYY-MM-DD');
    const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

    payout = bookings
      .filter(b => b.date === twoDaysAgo)
      .reduce((acc, b) => acc + b.amountPaid, 0);

    pending = bookings
      .filter(b => b.date === yesterday || b.date === today)
      .reduce((acc, b) => acc + b.amountPaid, 0);

    setAdvanceRevenue(advance);
    setFullRevenue(full);
    setFieldEstimate(estimate);
    setTotalRevenue(advance + full + estimate);
    setPayoutDone(payout);
    setPendingPayout(pending);
  }, [selectedTab, bookings]);

  return (
    <div className="min-h-screen w-full bg-black text-white p-4">
      <div className="w-full max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-white">💰 Revenue Dashboard</h1>

        {/* Tabs */}
        <div className="overflow-x-scroll md:overflow-hidden">
          <div className="flex space-x-3 min-w-max py-2 px-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full border whitespace-nowrap
                  ${selectedTab === tab.id
                    ? 'bg-lime-600 text-white border-lime-700'
                    : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                  } transition`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow p-5 text-center">
          <p className="text-gray-400 text-sm">Total Revenue (Advance + Full + Field Estimation)</p>
          <h2 className="text-3xl font-bold text-lime-400 mt-1">₹{totalRevenue}</h2>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-1">
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow p-4">
            <p className="text-gray-400 text-sm">Advance Payments</p>
            <h2 className="text-xl font-semibold text-blue-400">₹{advanceRevenue}</h2>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow p-4">
            <p className="text-gray-400 text-sm">Full Payments</p>
            <h2 className="text-xl font-semibold text-green-400">₹{fullRevenue}</h2>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow p-4">
            <p className="text-gray-400 text-sm">On-Field Estimation</p>
            <h2 className="text-xl font-semibold text-yellow-400">₹{fieldEstimate}</h2>
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default Revenue;

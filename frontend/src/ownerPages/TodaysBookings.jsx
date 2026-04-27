import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { parse, format, isToday, parseISO } from 'date-fns';
import { BookContext } from '../constexts/bookContext';
import {
  Clock, User, Phone, IndianRupee, CheckCircle2,
  ChevronDown, ChevronUp, CalendarX, CreditCard, BadgeCheck, Loader2, Repeat
} from 'lucide-react';

const formatTime = (t) => {
  if (!t) return '—';
  try { return format(parse(t, 'HH:mm', new Date()), 'hh:mm a'); }
  catch { return t; }
};

const statusColors = {
  confirmed: 'text-lime-400 bg-lime-400/10 border-lime-400/20',
  pending:   'text-amber-400 bg-amber-400/10 border-amber-400/20',
  cancelled: 'text-red-400 bg-red-400/10 border-red-400/20',
};

const TodaysBookings = () => {
  const { bookings, selectedTurfId } = useContext(BookContext);
  const [loading, setLoading]       = useState(true);
  const [subsLoading, setSubsLoading] = useState(true);
  const [expanded, setExpanded]     = useState(null);
  const [todayBookings, setToday]   = useState([]);
  const [todaySubs, setTodaySubs]   = useState([]);

  useEffect(() => {
    const fetchSubs = async () => {
      try {
        setSubsLoading(true);
        const res = await axios.get(`/owner/subscriptions?turfId=${selectedTurfId}`);
        const allSubs = res.data.subscription || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const activeToday = allSubs.filter(sub => {
          const startDate = new Date(sub.startDate);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(sub.endDate);
          endDate.setHours(0, 0, 0, 0);
          return startDate <= today && endDate >= today && sub.status === 'confirmed';
        });
        setTodaySubs(activeToday);
      } catch (err) {
        console.error("Failed to load subscriptions", err);
      } finally {
        setSubsLoading(false);
      }
    };

    if (selectedTurfId) {
      fetchSubs();
    } else {
      setSubsLoading(false);
    }
  }, [selectedTurfId]);

  useEffect(() => {
    const filtered = bookings.filter(b => isToday(parseISO(b.date)));
    setToday(filtered);
    setLoading(false);
  }, [bookings]);

  const totalToday    = todayBookings.reduce((s, b) => s + (b.amountPaid || 0), 0);
  const totalCount    = todayBookings.length + todaySubs.length;
  const confirmed     = todayBookings.filter(b => b.status === 'confirmed').length + todaySubs.length;

  if (loading || subsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-lime-400" size={32} />
      </div>
    );
  }

  const renderTable = (data, isSub = false) => {
    return (
      <div className="w-full overflow-x-auto bg-[#111] border border-white/5 rounded-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5 text-xs text-gray-400 uppercase tracking-wider">
              <th className="px-4 py-3 font-medium whitespace-nowrap">Time Slot</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Customer</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Phone & ID</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">{isSub ? 'Paid' : 'Advance'}</th>
              {!isSub && <th className="px-4 py-3 font-medium whitespace-nowrap">Total / Balance</th>}
              {isSub && <th className="px-4 py-3 font-medium whitespace-nowrap">Date Range</th>}
              <th className="px-4 py-3 font-medium whitespace-nowrap">Payment</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {data.map((booking) => {
              const name = booking.userId?.fullName || booking.userId?.fullname || booking.fullname || 'Guest';
              const phone = booking.userId?.phone || booking.phone || '—';
              const status = booking.status || 'confirmed';
              
              let slots = [];
              if (isSub) {
                if (booking.slot) slots = [booking.slot];
              } else {
                slots = booking.originalSlots || booking.slots || [];
              }
              const slotText = slots.length > 0 
                ? `${formatTime(slots[0].start)} - ${formatTime(slots[slots.length - 1].end)}`
                : '—';

              return (
                <tr key={booking._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-lime-400 font-medium">
                    {slotText}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-white">
                    <div className="flex items-center gap-1.5">
                      {name}
                      {isSub && <Repeat size={12} className="text-indigo-400" title="Subscription" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-gray-300">{phone}</div>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                      ID: {booking._id ? `...${booking._id.slice(-6)}` : '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                    ₹{booking.amountPaid || 0}
                  </td>
                  
                  {!isSub && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-gray-300">₹{booking.slotFees || 0}</div>
                      <div className="text-[10px] text-red-400 mt-0.5">
                        Due: ₹{Math.max(0, (booking.slotFees || 0) - (booking.amountPaid || 0))}
                      </div>
                    </td>
                  )}
                  
                  {isSub && (
                    <td className="px-4 py-3 whitespace-nowrap text-gray-400 text-xs">
                      {new Date(booking.startDate).toLocaleDateString()} <br/>
                      <span className="text-[10px] text-gray-600">to</span> {new Date(booking.endDate).toLocaleDateString()}
                    </td>
                  )}
                  
                  <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                    {booking.paymentType === 'Manual' || booking.paymentType === 'full' ? 'Manual/Cash' : 'Online'}
                  </td>
                  
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className={`text-[10px] border rounded px-2 py-1 uppercase tracking-wider font-semibold ${statusColors[status] || statusColors.confirmed}`}>
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-5 min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Visits Today', value: totalCount, icon: CalendarX, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Confirmed',      value: confirmed,            icon: BadgeCheck, color: 'text-lime-400', bg: 'bg-lime-500/10' },
            { label: "Today's Revenue",value: `₹${totalToday.toLocaleString()}`, icon: IndianRupee, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-[#111] border border-white/5 rounded-2xl p-4">
              <div className={`p-2 rounded-xl ${bg} w-fit mb-2`}>
                <Icon size={15} className={color} />
              </div>
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {totalCount === 0 ? (
          <div className="bg-[#111] border border-white/5 rounded-2xl p-12 text-center mt-8">
            <CalendarX size={40} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No bookings or subscriptions today</p>
            <p className="text-gray-600 text-sm mt-1">Enjoy the quiet — or go add a manual booking!</p>
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            
            {/* Regular Bookings */}
            {todayBookings.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-lime-400"></div>
                  Regular Bookings
                </h2>
                {renderTable(todayBookings, false)}
              </div>
            )}

            {/* Subscriptions */}
            {todaySubs.length > 0 && (
              <div className={todayBookings.length > 0 ? "pt-6 border-t border-white/5 mt-6" : ""}>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  Subscriptions Today
                </h2>
                {renderTable(todaySubs, true)}
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
};

export default TodaysBookings;

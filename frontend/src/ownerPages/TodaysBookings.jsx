import React, { useEffect, useState, useContext } from 'react';
import { parse, format, isToday, parseISO } from 'date-fns';
import { BookContext } from '../constexts/bookContext';
import {
  Clock, User, Phone, IndianRupee, CheckCircle2,
  ChevronDown, ChevronUp, CalendarX, CreditCard, BadgeCheck, Loader2
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
  const { bookings } = useContext(BookContext);
  const [loading, setLoading]       = useState(true);
  const [expanded, setExpanded]     = useState(null);
  const [todayBookings, setToday]   = useState([]);

  useEffect(() => {
    const filtered = bookings.filter(b => isToday(parseISO(b.date)));
    setToday(filtered);
    setLoading(false);
  }, [bookings]);

  const totalToday    = todayBookings.reduce((s, b) => s + (b.amountPaid || 0), 0);
  const confirmed     = todayBookings.filter(b => b.status === 'confirmed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-lime-400" size={32} />
      </div>
    );
  }

  return (
    <div className="p-5 min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Bookings', value: todayBookings.length, icon: CalendarX, color: 'text-blue-400', bg: 'bg-blue-500/10' },
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

        {/* Booking cards */}
        {todayBookings.length === 0 ? (
          <div className="bg-[#111] border border-white/5 rounded-2xl p-12 text-center">
            <CalendarX size={40} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No bookings today</p>
            <p className="text-gray-600 text-sm mt-1">Enjoy the quiet — or go add a manual booking!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayBookings.map(booking => {
              const isOpen = expanded === booking._id;
              const name = booking.userId?.fullname || booking.fullname || 'Guest';
              const slots = booking.originalSlots || booking.slots || [];
              const status = booking.status || 'confirmed';

              return (
                <div
                  key={booking._id}
                  className={`bg-[#111] border rounded-2xl overflow-hidden transition-all
                    ${isOpen ? 'border-lime-500/30' : 'border-white/5 hover:border-white/10'}`}
                >
                  {/* Card header — always visible */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : booking._id)}
                  >
                    {/* Time column */}
                    <div className="min-w-[90px]">
                      <div className="flex items-center gap-1.5 text-lime-400 mb-0.5">
                        <Clock size={12} />
                        <span className="text-xs font-medium">
                          {slots.length > 0 ? formatTime(slots[0].start) : '—'}
                        </span>
                      </div>
                      {slots.length > 0 && (
                        <p className="text-[10px] text-gray-600">
                          → {formatTime(slots[slots.length - 1].end)}
                        </p>
                      )}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-gray-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-white truncate">{name}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                        <Phone size={10} />
                        {booking.userId?.phone || booking.phone || '—'}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right mr-2">
                      <div className="flex items-center gap-1 text-white font-semibold text-sm justify-end">
                        <IndianRupee size={12} />
                        {booking.amountPaid || 0}
                      </div>
                      <span className={`text-[10px] border rounded px-1.5 py-0.5 mt-1 inline-block ${statusColors[status] || statusColors.confirmed}`}>
                        {status}
                      </span>
                    </div>

                    {/* Expand chevron */}
                    <div className="text-gray-600">
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isOpen && (
                    <div className="border-t border-white/5 p-4 bg-white/[0.02] space-y-4">
                      {/* Slots */}
                      <div>
                        <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Slots</p>
                        <div className="flex flex-wrap gap-2">
                          {slots.map((s, i) => (
                            <span key={i} className="text-xs bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-gray-300">
                              {formatTime(s.start)} – {formatTime(s.end)}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          { label: 'Email', value: booking.userId?.email || '—' },
                          { label: 'Payment Type', value: booking.paymentType || '—' },
                          { label: 'Slot Fees', value: `₹${booking.slotFees || 0}` },
                          { label: 'Amount Paid', value: `₹${booking.amountPaid || 0}` },
                          { label: 'Balance Due', value: `₹${Math.max(0, (booking.slotFees || 0) - (booking.amountPaid || 0))}` },
                          { label: 'Payment ID', value: booking.razorpay_payment_id ? `...${booking.razorpay_payment_id.slice(-6)}` : 'Manual' },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p className="text-[10px] text-gray-600 mb-0.5">{label}</p>
                            <p className="text-xs text-gray-300 font-medium truncate">{value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Quick action */}
                      {status !== 'cancelled' && (
                        <div className="flex items-center gap-2 pt-1">
                          <div className="flex items-center gap-1.5 text-xs text-lime-400">
                            <CheckCircle2 size={14} />
                            <span>Booking confirmed</span>
                          </div>
                          <span className="text-gray-700">·</span>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <CreditCard size={13} />
                            <span>
                              {booking.paymentType === 'Manual' ? 'Cash/Manual' : 'Online payment'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodaysBookings;

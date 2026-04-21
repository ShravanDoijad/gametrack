import React, { useState, useEffect, useContext } from "react";
import { BookContext } from "../constexts/bookContext";
import moment from "moment";
import {
  CalendarDays, Wallet, Clock4, Banknote,
  Smartphone, HandCoins, TrendingUp, IndianRupee
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Cell
} from "recharts";

const Revenue = () => {
  const { bookings } = useContext(BookContext);

  const [mode, setMode]   = useState("all");    // all | Manual | advance | full
  const [period, setPeriod] = useState("total"); // total | today | month

  const [stats, setStats] = useState({
    advance: 0, full: 0, manual: 0, pending: 0, total: 0
  });

  const [weeklyData, setWeeklyData] = useState([]);

  useEffect(() => {
    const today     = moment().format("YYYY-MM-DD");
    const thisMonth = moment().format("YYYY-MM");

    // Period filter
    let filtered = bookings.filter(b => b.status !== "cancelled");
    if (period === "today")  filtered = filtered.filter(b => moment(b.date).format("YYYY-MM-DD") === today);
    if (period === "month")  filtered = filtered.filter(b => moment(b.date).format("YYYY-MM") === thisMonth);

    // Payment mode filter
    if (mode !== "all") filtered = filtered.filter(b => b.paymentType === mode);

    // Stats
    let advance = 0, full = 0, manual = 0, pending = 0;
    filtered.forEach(b => {
      const paid  = b.amountPaid  || 0;
      const total = b.slotFees    || 0;
      const due   = Math.max(0, total - paid);

      if (b.paymentType === "advance") { advance += paid; pending += due; }
      else if (b.paymentType === "full" || b.paymentType === "online") { full += paid; }
      else if (b.paymentType === "Manual") { manual += paid; pending += due; }
    });

    setStats({ advance, full, manual, pending, total: advance + full + manual });

    // Last 7 days chart (ignores mode/period filters — always all bookings)
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = moment().subtract(i, "days");
      const dateStr = d.format("YYYY-MM-DD");
      const dayRevenue = bookings
        .filter(b => moment(b.date).format("YYYY-MM-DD") === dateStr && b.status !== "cancelled")
        .reduce((s, b) => s + (b.amountPaid || 0), 0);
      days.push({ day: d.format("ddd"), revenue: dayRevenue });
    }
    setWeeklyData(days);

  }, [mode, period, bookings]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-sm shadow-xl">
        <p className="text-gray-400 mb-1">{label}</p>
        <p className="text-lime-400 font-semibold">₹{payload[0].value.toLocaleString()}</p>
      </div>
    );
  };

  const maxRevenue = Math.max(...weeklyData.map(d => d.revenue), 1);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-5">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Period tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: "total", label: "All Time", icon: Wallet },
            { id: "today", label: "Today",    icon: CalendarDays },
            { id: "month", label: "This Month", icon: Clock4 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setPeriod(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all
                ${period === id
                  ? "bg-lime-500/15 border-lime-500/30 text-lime-400"
                  : "bg-[#111] border-white/5 text-gray-400 hover:text-white hover:border-white/10"
                }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* Payment mode filter */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: "all",     label: "All",    icon: Wallet    },
            { id: "Manual",  label: "Manual", icon: HandCoins },
            { id: "advance", label: "Online", icon: Smartphone },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all
                ${mode === id
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-[#111] border-white/5 text-gray-500 hover:text-white"
                }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Hero total */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 text-center">
          <p className="text-gray-500 text-sm mb-1">Revenue collected</p>
          <div className="flex items-center justify-center gap-1 text-4xl font-bold text-lime-400">
            <IndianRupee size={28} />
            {stats.total.toLocaleString()}
          </div>
          {stats.pending > 0 && (
            <p className="text-amber-400/80 text-sm mt-2">
              + ₹{stats.pending.toLocaleString()} pending collection on field
            </p>
          )}
        </div>

        {/* Breakdown cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Advance Payments", value: stats.advance, icon: Banknote,   color: "text-blue-400",   bg: "bg-blue-500/10"  },
            { label: "Full Payments",    value: stats.full,    icon: Wallet,      color: "text-lime-400",   bg: "bg-lime-500/10"  },
            { label: "Manual (Cash)",    value: stats.manual,  icon: HandCoins,   color: "text-purple-400", bg: "bg-purple-500/10" },
            { label: "Pending on Field", value: stats.pending, icon: Clock4,      color: "text-amber-400",  bg: "bg-amber-500/10" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-[#111] border border-white/5 rounded-2xl p-4">
              <div className={`p-2 rounded-xl ${bg} w-fit mb-3`}>
                <Icon size={15} className={color} />
              </div>
              <p className={`text-xl font-bold ${color}`}>₹{value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* 7-day chart */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-lime-400" />
            <span className="text-sm font-medium">Last 7 Days Revenue</span>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#555', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff06' }} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} animationDuration={1000}>
                  {weeklyData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={`rgba(163,230,53,${0.3 + (d.revenue / maxRevenue) * 0.7})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Revenue;

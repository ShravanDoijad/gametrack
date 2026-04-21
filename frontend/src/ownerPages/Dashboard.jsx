import React, { useEffect, useState, useContext, useMemo } from 'react';
import axios from 'axios';
import { BookContext } from '../constexts/bookContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import {
  TrendingUp, IndianRupee, CalendarCheck, Users,
  Flame, Clock3, BarChart2, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState([]);
  const [view, setView] = useState('month');
  const { selectedTurfId, turfs } = useContext(BookContext);

  useEffect(() => {
    if (!selectedTurfId) return;
    axios.get(`/owner/dashboardDetails?turfId=${selectedTurfId}`)
      .then(r => setDashboardData(r.data.details || []))
      .catch(console.error);
  }, [selectedTurfId]);

  const now = new Date();

  /* ── chart data ── */
  const chartData = useMemo(() => {
    const map = {};
    if (view === '7days') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(now.getDate() - i);
        const k = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
        map[k] = { date: k, revenue: 0, bookings: 0 };
      }
    } else if (view === 'week') {
      [1,2,3,4,5].forEach(w => { map[`Week ${w}`] = { date: `Week ${w}`, revenue: 0, bookings: 0 }; });
    } else {
      const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= days; i++) {
        const k = `${i} ${now.toLocaleString('default', { month: 'short' })}`;
        map[k] = { date: k, revenue: 0, bookings: 0 };
      }
    }
    dashboardData.forEach(b => {
      const bd = new Date(b.date);
      if (bd.getMonth() !== now.getMonth() || bd.getFullYear() !== now.getFullYear()) return;
      let key;
      if (view === '7days') key = `${bd.getDate()} ${now.toLocaleString('default', { month: 'short' })}`;
      else if (view === 'week') key = `Week ${Math.ceil(bd.getDate() / 7)}`;
      else key = `${bd.getDate()} ${now.toLocaleString('default', { month: 'short' })}`;
      if (map[key]) { map[key].revenue += b.amountPaid || 0; map[key].bookings += 1; }
    });
    return Object.values(map);
  }, [dashboardData, view]);

  /* ── real stats ── */
  const totalRevenue = dashboardData.reduce((s, b) => s + (b.amountPaid || 0), 0);
  const totalBookings = dashboardData.length;

  const todayBookings = useMemo(() =>
    dashboardData.filter(b => {
      const d = new Date(b.date);
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length, [dashboardData]);

  const uniqueCustomers = useMemo(() =>
    new Set(dashboardData.map(b => b.userId?._id || b.phone).filter(Boolean)).size,
    [dashboardData]);

  /* ── peak day (by booking count) ── */
  const peakDay = useMemo(() => {
    const dayCounts = {};
    dashboardData.forEach(b => {
      const d = new Date(b.date).getDay();
      dayCounts[d] = (dayCounts[d] || 0) + 1;
    });
    if (!Object.keys(dayCounts).length) return { day: '—', count: 0 };
    const topDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
    return { day: DAYS[topDay[0]], count: topDay[1] };
  }, [dashboardData]);

  /* ── prime hour ── */
  const primeHour = useMemo(() => {
    const hourCounts = {};
    dashboardData.forEach(b => {
      b.slots?.forEach(slot => {
        const h = parseInt(slot.start?.split(':')[0] || 0);
        hourCounts[h] = (hourCounts[h] || 0) + 1;
      });
    });
    if (!Object.keys(hourCounts).length) return '—';
    const top = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    const h = parseInt(top[0]);
    return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`;
  }, [dashboardData]);

  /* ── occupancy rate (booked hours / total possible hours this month) ── */
  const occupancyRate = useMemo(() => {
    if (!dashboardData.length) return 0;
    const turf = turfs?.find(t => t._id === selectedTurfId);
    if (!turf) return 0;
    const [oh] = (turf.openingTime || '06:00').split(':').map(Number);
    const [ch] = (turf.closingTime || '23:00').split(':').map(Number);
    const hoursPerDay = ch - oh;
    const daysElapsed = now.getDate();
    const totalHours = hoursPerDay * daysElapsed;
    const bookedHours = dashboardData.reduce((s, b) => {
      return s + (b.slots?.reduce((ss, sl) => {
        const [sh, sm] = (sl.start || '00:00').split(':').map(Number);
        const [eh, em] = (sl.end || '00:00').split(':').map(Number);
        return ss + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
      }, 0) || 0);
    }, 0);
    return Math.min(100, Math.round((bookedHours / totalHours) * 100));
  }, [dashboardData, turfs, selectedTurfId]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-sm shadow-xl">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name === 'revenue' ? `₹${p.value.toLocaleString()}` : `${p.value} bookings`}
          </p>
        ))}
      </div>
    );
  };

  const statCards = [
    {
      label: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: IndianRupee,
      color: 'text-lime-400',
      bg: 'bg-lime-500/10',
      sub: `This month`,
      up: true,
    },
    {
      label: 'Total Bookings',
      value: totalBookings,
      icon: CalendarCheck,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      sub: `${todayBookings} today`,
      up: todayBookings > 0,
    },
    {
      label: 'Unique Customers',
      value: uniqueCustomers,
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      sub: 'All time',
      up: true,
    },
    {
      label: 'Occupancy Rate',
      value: `${occupancyRate}%`,
      icon: TrendingUp,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      sub: 'This month',
      up: occupancyRate > 50,
    },
  ];

  return (
    <div className="p-5 min-h-screen bg-[#0a0a0a] text-white space-y-6">

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ label, value, icon: Icon, color, bg, sub, up }) => (
          <div key={label} className="bg-[#111] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-xl ${bg}`}>
                <Icon size={16} className={color} />
              </div>
              <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? 'text-lime-400' : 'text-red-400'}`}>
                {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Bar */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 size={16} className="text-lime-400" />
              <span className="text-sm font-medium">Revenue</span>
            </div>
            <div className="flex gap-1">
              {['7days','week','month'].map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    view === v ? 'bg-lime-500 text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {v === '7days' ? '7D' : v === 'week' ? 'WK' : 'MO'}
                </button>
              ))}
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={view === 'month' ? 4 : 12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} interval={view === 'month' ? 4 : 0} />
                <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff08' }} />
                <Bar dataKey="revenue" radius={[4,4,0,0]} animationDuration={1200}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={`rgba(163,230,53,${0.4 + (chartData[i]?.revenue / (Math.max(...chartData.map(d => d.revenue)) || 1)) * 0.6})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booking trend line */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-blue-400" />
            <span className="text-sm font-medium">Booking Trends</span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} interval={view === 'month' ? 4 : 0} />
                <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#60a5fa', strokeWidth: 0 }}
                  animationDuration={1200}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insights — now with real data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5 hover:border-lime-500/20 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10">
              <Flame size={16} className="text-amber-400" />
            </div>
            <p className="text-sm font-medium">Peak Day</p>
          </div>
          <p className="text-3xl font-bold text-white">{peakDay.day}</p>
          {peakDay.count > 0
            ? <p className="text-xs text-gray-500 mt-1">{peakDay.count} bookings — your busiest day</p>
            : <p className="text-xs text-gray-600 mt-1">Not enough data yet</p>
          }
        </div>

        <div className="bg-[#111] border border-white/5 rounded-2xl p-5 hover:border-blue-500/20 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-500/10">
              <Clock3 size={16} className="text-blue-400" />
            </div>
            <p className="text-sm font-medium">Prime Hour</p>
          </div>
          <p className="text-3xl font-bold text-white">{primeHour}</p>
          <p className="text-xs text-gray-500 mt-1">Most popular booking start time</p>
        </div>

        <div className="bg-[#111] border border-white/5 rounded-2xl p-5 hover:border-purple-500/20 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-purple-500/10">
              <TrendingUp size={16} className="text-purple-400" />
            </div>
            <p className="text-sm font-medium">Avg. per Booking</p>
          </div>
          <p className="text-3xl font-bold text-white">
            ₹{totalBookings > 0 ? Math.round(totalRevenue / totalBookings).toLocaleString() : '0'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Average revenue per booking</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

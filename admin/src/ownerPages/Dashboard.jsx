import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { BookContext } from '../constexts/bookContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { BarChartBig, LineChart as LineChartIcon, Calendar, Clock3, TrendingUp } from 'lucide-react';

const Dashboard = () => {

  const [dashboardData, setDashboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('month');
  const {selectedTurfId, setSelectedTurfId, turfs, setTurfs}= useContext(BookContext)
 

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!selectedTurfId) return;
      try {
        const response = await axios.get(`/owner/dashboardDetails?turfId=${selectedTurfId}`);
        setDashboardData(response.data.details);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };
    fetchDashboardData();
  }, [selectedTurfId]);

  const handleTurfChange = (e) => {
    setSelectedTurfId(e.target.value);
  };

  const now = new Date();

  const generateChartData = (bookings = []) => {
    const map = {};

    if (view === '7days') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        const key = `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
        map[key] = { date: key, revenue: 0, bookings: 0 };
      }
    } else if (view === 'week') {
      for (let i = 1; i <= 5; i++) {
        map[`Week ${i}`] = { date: `Week ${i}`, revenue: 0, bookings: 0 };
      }
    } else {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const key = `${i} ${now.toLocaleString('default', { month: 'short' })}`;
        map[key] = { date: key, revenue: 0, bookings: 0 };
      }
    }

    bookings?.forEach((booking) => {
      const bookingDate = new Date(booking.date);
      const month = bookingDate.getMonth();
      const year = bookingDate.getFullYear();
      const sameMonth = month === now.getMonth() && year === now.getFullYear();

      if (!sameMonth) return;

      let key;
      if (view === '7days') {
        key = `${bookingDate.getDate()} ${now.toLocaleString('default', { month: 'short' })}`;
      } else if (view === 'week') {
        const week = Math.ceil(bookingDate.getDate() / 7);
        key = `Week ${week}`;
      } else {
        key = `${bookingDate.getDate()} ${now.toLocaleString('default', { month: 'short' })}`;
      }

      if (map[key]) {
        map[key].revenue += booking.amountPaid || 0;
        map[key].bookings += 1;
      }
    });

    return Object.values(map);
  };

  const currentChartData = generateChartData(dashboardData);
  const totalRevenue = dashboardData?.reduce((acc, booking) => acc + (booking.slotFees || 0), 0);

  return (
    <div className="p-4 min-h-screen bg-black text-white">
      
      <header className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-3">
            <TrendingUp size={24} className="text-green-400" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Turf Analytics Dashboard
            </h1>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <select
              value={selectedTurfId}
              onChange={handleTurfChange}
              className="border border-gray-700 rounded-md px-3 py-2 text-sm bg-gray-900 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {turfs.map((turf) => (
                <option key={turf._id} value={turf._id}>
                  {turf.name}
                </option>
              ))}
            </select>

            <select
              value={view}
              onChange={(e) => setView(e.target.value)}
              className="border border-gray-700 rounded-md px-3 py-2 text-sm bg-gray-900 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7days">Last 7 Days</option>
              <option value="week">This Month by Week</option>
              <option value="month">Full Month</option>
            </select>
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-green-400">₹{totalRevenue?.toFixed(2)}</p>
            </div>
            <div className="text-xs text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </header>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-md font-medium flex items-center gap-2">
              <BarChartBig size={18} className="text-yellow-400" />
              <span>Revenue Analysis</span>
            </h3>
            <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">
              {view === '7days' ? '7 Days' : view === 'week' ? 'Weekly' : 'Monthly'}
            </span>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" tick={{ fill: '#aaa' }} fontSize={11} />
                <YAxis tick={{ fill: '#aaa' }} fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#111',
                    borderColor: '#333',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }} 
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#34d399" 
                  radius={[4, 4, 0, 0]} 
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-md font-medium flex items-center gap-2">
              <LineChartIcon size={18} className="text-blue-400" />
              <span>Booking Trends</span>
            </h3>
            <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">
              {view === '7days' ? '7 Days' : view === 'week' ? 'Weekly' : 'Monthly'}
            </span>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" tick={{ fill: '#aaa' }} fontSize={11} />
                <YAxis tick={{ fill: '#aaa' }} fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#111',
                    borderColor: '#333',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="bookings" 
                  stroke="#60a5fa" 
                  strokeWidth={2} 
                  dot={{ r: 3 }} 
                  activeDot={{ r: 5 }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Insights Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-gradient-to-br from-gray-900 to-gray-900/50 border border-gray-800 hover:border-green-500/30 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-yellow-500/10">
              <Calendar size={18} className="text-yellow-400" />
            </div>
            <h4 className="font-medium">Peak Day</h4>
          </div>
          <p className="text-sm text-gray-400">
            Analytics coming soon to identify your most profitable days and optimize scheduling.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-gray-900 to-gray-900/50 border border-gray-800 hover:border-purple-500/30 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-purple-500/10">
              <Clock3 size={18} className="text-purple-400" />
            </div>
            <h4 className="font-medium">Prime Hours</h4>
          </div>
          <p className="text-sm text-gray-400">
            Future feature will highlight your most popular booking times for dynamic pricing.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-gray-900 to-gray-900/50 border border-gray-800 hover:border-pink-500/30 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-pink-500/10">
              <TrendingUp size={18} className="text-pink-400" />
            </div>
            <h4 className="font-medium">Performance</h4>
          </div>
          <p className="text-sm text-gray-400">
            Comparative analytics in development to track weekly/monthly growth metrics.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
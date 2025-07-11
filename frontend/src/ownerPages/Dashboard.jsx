import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

const Dashboard = () => {
  const [turfs, setTurfs] = useState([]);
  const [selectedTurfId, setSelectedTurfId] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTurfs = async () => {
      try {
        const response = await axios.get('/owner/ownedTurfs');
        setTurfs(response.data.turfs || []);
        if (response.data.turfs.length > 0) {
          setSelectedTurfId(response.data.turfs[0]._id);
        }
      } catch (error) {
        console.error('Failed to fetch turfs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTurfs();
  }, []);

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

  const generateCurrentMonthStats = (bookings = []) => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const chartMap = {};
    for (let i = 1; i <= daysInMonth; i++) {
      const day = `${i} ${now.toLocaleString('default', { month: 'short' })}`;
      chartMap[day] = { date: day, revenue: 0, bookings: 0 };
    }
    bookings?.forEach((booking) => {
      const bookingDate = new Date(booking.date);
      const month = bookingDate.getMonth();
      const year = bookingDate.getFullYear();
      if (month === now.getMonth() && year === now.getFullYear()) {
        const day = `${bookingDate.getDate()} ${now.toLocaleString('default', { month: 'short' })}`;
        if (chartMap[day]) {
          chartMap[day].revenue += booking.amountPaid || 0;
          chartMap[day].bookings += 1;
        }
      }
    });
    return Object.values(chartMap);
  };

  const currentMonthChartData = dashboardData ? generateCurrentMonthStats(dashboardData) : [];

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Owner Dashboard</h1>
        <select
          value={selectedTurfId}
          onChange={handleTurfChange}
          className="border border-gray-300 rounded-md p-2 text-sm bg-white"
        >
          {turfs.map((turf) => (
            <option key={turf._id} value={turf._id}>
              {turf.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-md font-semibold mb-2">Current Month Revenue</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={currentMonthChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#34d399" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-md font-semibold mb-2">Current Month Bookings</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={currentMonthChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="bookings" stroke="#60a5fa" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
      </div>
    </div>
  );
};

export default Dashboard;

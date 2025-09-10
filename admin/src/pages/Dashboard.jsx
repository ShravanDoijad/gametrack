import React, { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
const Dashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [turfs, setTurfs] = useState([]);
  const navigate = useNavigate()
  
  const getAdminInfo = async () => {
    try {
      const [bookingRes, usersRes, turfsRes] = await Promise.all([
        axios.get("/admin/getAllBookings"),
        axios.get("/admin/getAllUsers"),
        axios.get("/admin/getAllTurfs"),
      ]);

      setBookings(bookingRes.data);
      setUsers(usersRes.data);
      setTurfs(turfsRes.data);
    } catch (error) {
      alert(error.response?.data?.message || "Error fetching data");
    }
  };

  useEffect(() => {
    getAdminInfo();
  }, []);

  const chartData = [
    { name: "Bookings", value: bookings.length },
    { name: "Users", value: users.length },
    { name: "Turfs", value: turfs.length },
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4 md:p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white shadow-md rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-700">Bookings</h3>
          <p className="text-3xl font-bold text-blue-600">{bookings.length}</p>
        </div>
        <div onClick={()=>navigate('/users', {
          state: { users }
        })} className="bg-white shadow-md rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-700">Users</h3>
          <p className="text-3xl font-bold text-green-600">{users.length}</p>
        </div>
        <div className="bg-white shadow-md rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-700">Turfs</h3>
          <p className="text-3xl font-bold text-purple-600">{turfs.length}</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;

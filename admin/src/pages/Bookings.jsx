import React from "react";
import { CalendarDays, User, Wallet } from "lucide-react";

const Bookings = () => {
  const bookings = [
    { id: 1, user: "Rahul Sharma", turf: "Greenfield Turf", date: "2025-08-27", time: "6:00 PM", amount: "₹1200" },
    { id: 2, user: "Sneha Patil", turf: "City Sports Arena", date: "2025-08-28", time: "7:30 PM", amount: "₹1500" },
    { id: 3, user: "Amit Deshmukh", turf: "Victory Ground", date: "2025-08-29", time: "5:00 PM", amount: "₹1000" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Bookings</h1>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Turf</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Time</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 flex items-center gap-2">
                  <User size={16} /> {booking.user}
                </td>
                <td className="px-4 py-3">{booking.turf}</td>
                <td className="px-4 py-3 flex items-center gap-2">
                  <CalendarDays size={16} /> {booking.date}
                </td>
                <td className="px-4 py-3">{booking.time}</td>
                <td className="px-4 py-3 flex items-center gap-2">
                  <Wallet size={16} /> {booking.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Bookings;

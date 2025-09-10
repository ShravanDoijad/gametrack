import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
      
      <Card className="rounded-2xl shadow-lg">
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Turf</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="flex items-center gap-2">
                    <User size={16} /> {booking.user}
                  </TableCell>
                  <TableCell>{booking.turf}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <CalendarDays size={16} /> {booking.date}
                  </TableCell>
                  <TableCell>{booking.time}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Wallet size={16} /> {booking.amount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Bookings;

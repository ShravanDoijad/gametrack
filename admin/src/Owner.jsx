// src/Owner.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import OwnerLayout from "./ownerComponents/OwnerLayout";
import Dashboard from "./ownerPages/Dashboard";
import Bookings from "./ownerPages/Bookings";
import Revenue from "./ownerPages/Revenue";
import TurfProfile from "./ownerPages/TurfProfile";
import Customers from "./ownerPages/Customers";
import TodaysBookings from "./ownerPages/TodaysBookings";
import OwnerPrivateRoute from "./OwnerPrivateRoute";
import TimeSlots from "./ownerPages/TimeSlots";

const Owner = () => {
  return (
    <div className="min-h-screen w-full text-white ">
      
      <Routes>
        <Route path="/" element={<OwnerLayout />}>
        <Route element={<OwnerPrivateRoute />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="revenue" element={<Revenue />} />
          <Route path="turf-profile" element={<TurfProfile />} />
          <Route path="time-slots" element={<TimeSlots />} />
          
          <Route path="/turfTodaysbookings" element={<TodaysBookings />} />
          
          <Route path="*" element={<div className="text-center text-gray-400">Page Not Found</div>} />
          <Route path="customers" element={<Customers />} />
        </Route>
        </Route>
      </Routes>
    </div>
  );
};

export default Owner;

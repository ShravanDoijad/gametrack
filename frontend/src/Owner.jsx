// src/Owner.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";

import OwnerLayout from "./ownerComponents/OwnerLayout";
import Dashboard from "./ownerPages/Dashboard";
import Bookings from "./ownerPages/Bookings";
import Revenue from "./ownerPages/Revenue";
import TurfProfile from "./ownerPages/TurfProfile";
import Customers from "./ownerPages/Customers";

const Owner = () => {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      <Routes>
        <Route path="/" element={<OwnerLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="revenue" element={<Revenue />} />
          <Route path="turf-profile" element={<TurfProfile />} />
          <Route path="customers" element={<Customers />} />
        </Route>
      </Routes>
    </div>
  );
};

export default Owner;

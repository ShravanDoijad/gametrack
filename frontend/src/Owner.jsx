// src/Owner.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import { useContext } from "react";
import { BookContext } from "./constexts/bookContext";
import OwnerLayout from "./ownerComponents/OwnerLayout";
import Dashboard from "./ownerPages/Dashboard";
import Bookings from "./ownerPages/Bookings";
import Revenue from "./ownerPages/Revenue";
import TurfProfile from "./ownerPages/TurfProfile";
import Customers from "./ownerPages/Customers";
import PushNotifier from "./components/PushNotifier";

const Owner = () => {
  const {userInfo, token} = useContext(BookContext)
  
  return (
    <div className="min-h-screen w-full bg-gray-50">
      {token && userInfo && userInfo.role==="owner" && <PushNotifier ownerId={userInfo._id} type="owner" />}
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

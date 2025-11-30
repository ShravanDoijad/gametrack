import React, { useState, useContext } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Menu, X, Home, Calendar, DollarSign, Users, Settings } from "lucide-react";
import { BookContext } from "../constexts/bookContext";
const OwnerLayout = () => {
 
  const {sidebarOpen, closeSidebar}=  useContext(BookContext)
  const navItems = [
    { path: "/owner/dashboard", icon: <Home size={20} />, label: "Dashboard" },
    { path: "/owner/bookings", icon: <Calendar size={20} />, label: "Bookings" },
    { path: "/owner/revenue", icon: <DollarSign size={20} />, label: "Revenue" },
    { path: "/owner/customers", icon: <Users size={20} />, label: "Customers" },
    { path: "/owner/turf-profile", icon: <Settings size={20} />, label: "Turf Profile" },
    { path: "/owner/subscription", icon: <Settings size={20} />, label: "Turf subscriptions" },
    {path: "/owner/turfTodaysbookings", icon: <Calendar size={20} />, label: "Today's Bookings" },
  ];

  return (
    <div className="flex">
      
      <aside
        className={`${sidebarOpen ? "-translate-x-0" : "translate-x-full"} 
          fixed right-0 md:static md:translate-x-0 z-40 w-64 bg-gray-800 text-white min-h-screen p-4 
          transition-transform duration-300 ease-in-out`}
      >
        <button
          onClick={closeSidebar}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-700 lg:hidden"
        >
          <X size={24} />
        </button>

        <nav className="flex flex-col gap-2 mt-12">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded hover:bg-gray-700 transition-colors ${
                  isActive ? "bg-gray-700" : ""
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 w-full min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default OwnerLayout;
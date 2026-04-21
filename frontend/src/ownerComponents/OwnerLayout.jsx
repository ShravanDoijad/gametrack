import React, { useContext, useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, IndianRupee, Users,
  Settings, X, Clock, ChevronRight, ListChecks, Bell, LogOut, Trophy
} from "lucide-react";
import { BookContext } from "../constexts/bookContext";

const navItems = [
  { path: "/owner/dashboard",          icon: LayoutDashboard, label: "Dashboard"         },
   { path: "/owner/tournaments", icon: Trophy, label: "Tournaments" },
// (import Trophy from "lucide-react")
  { path: "/owner/bookings",           icon: CalendarDays,    label: "Bookings"           },
  { path: "/owner/turfTodaysbookings", icon: ListChecks,      label: "Today's Bookings"   },
  { path: "/owner/time-slots",         icon: Clock,           label: "Manage Slots"       },
  { path: "/owner/revenue",            icon: IndianRupee,     label: "Revenue"            },
  { path: "/owner/customers",          icon: Users,           label: "Customers"          },
  { path: "/owner/subscription",       icon: Bell,            label: "Subscriptions"      },
  { path: "/owner/turf-profile",       icon: Settings,        label: "Turf Profile"       },
];

const OwnerLayout = () => {
  const { sidebarOpen, closeSidebar, turfs, selectedTurfId, setSelectedTurfId } = useContext(BookContext);
  const location = useLocation();

  const currentPage = navItems.find(i => location.pathname.startsWith(i.path))?.label || "Dashboard";

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sora">

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed right-0 top-0 bottom-0 z-40 w-64 bg-[#111] border-l border-white/5
          flex flex-col transition-transform duration-300 ease-in-out
          md:static md:translate-x-0 md:border-r md:border-l-0
          ${sidebarOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-lime-500 flex items-center justify-center">
              <span className="text-black font-bold text-sm">G</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">GameTrack</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Owner Dashboard</p>
            </div>
          </div>
          <button onClick={closeSidebar} className="md:hidden text-gray-500 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {/* Turf Switcher */}
        {turfs?.length > 0 && (
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Active Turf</p>
            <select
              value={selectedTurfId}
              onChange={e => setSelectedTurfId(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-lime-500"
            >
              {turfs.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group
                 ${isActive
                   ? "bg-lime-500/15 text-lime-400 font-medium"
                   : "text-gray-400 hover:text-white hover:bg-white/5"
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? "text-lime-400" : "text-gray-500 group-hover:text-gray-300"} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={14} className="text-lime-400/60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 cursor-pointer transition">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-400 to-emerald-600 flex items-center justify-center text-black text-xs font-bold">
              O
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Owner</p>
              <p className="text-[10px] text-gray-500">Turf Manager</p>
            </div>
            <LogOut size={15} className="text-gray-500 hover:text-red-400 transition" />
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-5 py-3.5 flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-white">{currentPage}</h1>
            <p className="text-[11px] text-gray-500">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default OwnerLayout;

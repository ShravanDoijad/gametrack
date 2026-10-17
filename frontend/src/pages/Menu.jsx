import React, { useContext, useState } from "react";
import { Home, CalendarDays, User, Plus, Wallet, CalendarPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { BookContext } from "../constexts/bookContext";
import TurfSwitcher from "../components/TurfSwitcher";
import footballIcon from "../assets/football.png";
import cricketIcon from "../assets/cricket.png";
import badmintonIcon from "../assets/badminton.png";

const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, userInfo, turfs } = useContext(BookContext);
  const [showBookingModal, setShowBookingModal] = useState(false);


  
const isOwner = userInfo?.role === "owner";
const commonTabs = isOwner ? [
  { id: "home", icon: <Home size={21} />, label: "Overview", path: "/owner/dashboard", active: location.pathname === "/owner" || location.pathname.includes("/owner/dashboard") },
  { id: "bookings", icon: <CalendarDays size={21} />, label: "Bookings", path: "/owner/bookings", active: location.pathname.includes("/owner/bookings") || location.pathname.includes("turfTodaysbookings") },
  { id: "add", icon: <CalendarPlus size={22} />, label: "Add booking", path: "/owner/time-slots", active: false, primary: true },
  { id: "payments", icon: <Wallet size={21} />, label: "Payments", path: "/owner/revenue", active: location.pathname.includes("/owner/revenue") },
  { id: "profile", icon: <User size={21} />, label: "Turf", path: "/owner/turf-profile", active: location.pathname.includes("/owner/turf-profile") },
] : [
  { id: "home", icon: <Home size={22} />, label: "Turfs", path: "/", active: location.pathname === "/" || location.pathname.startsWith("/overview/") },
  { id: "bookings", icon: <CalendarDays size={22} />, label: "Bookings", path: "/userBookings", active: location.pathname.toLowerCase().includes("userbookings") },
  { id: "profile", icon: <User size={22} />, label: "Profile", path: token ? "/profile" : "/login", active: location.pathname.includes("profile") || location.pathname.includes("login") },
];



  return (
    <>
     
      <nav className="fixed bottom-[max(env(safe-area-inset-bottom),0.75rem)] left-3 right-3 z-50 sm:left-5 sm:right-5 md:left-auto md:right-6 md:w-[26rem]">
        <div className="flex h-[4.25rem] items-stretch justify-around rounded-2xl border border-white/10 bg-gray-950/90 px-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:px-2">
          {commonTabs.map((tab) => (
            <React.Fragment key={tab.id}>
              
                <button
                  onClick={() => navigate(tab.path)}
                  aria-current={tab.active ? 'page' : undefined}
                  aria-label={tab.label}
                  data-tour={tab.id === 'home' && !isOwner ? 'explore-turfs' : undefined}
                  className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lime-400 ${tab.primary ? "-translate-y-2 rounded-2xl bg-emerald-700 text-white shadow-lg shadow-black/30" : tab.active ? 'text-lime-300' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                >
                  <div className="relative">
                    {tab.icon}
                    {tab.active && (
                      <motion.div 
                        layoutId="activeTabIndicator"
                        className="absolute -inset-2 bg-lime-400/10 rounded-full z-[-1]"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    {tab.id === 'bookings' && userInfo?.pendingBookings > 0 && (
                      <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-lg shadow-rose-500/40">
                        {userInfo.pendingBookings}
                      </span>
                    )}
                  </div>
                  <span className="max-w-full truncate text-[10px] font-medium leading-3 sm:text-[11px]">{tab.label}</span>
                </button>
                
            
            </React.Fragment>
          ))}
          {token && userInfo?.role === "owner" && turfs.length > 1 && <TurfSwitcher />}
        </div>
      </nav>

      {/* Quick Book Modal */}
      <AnimatePresence>
        {showBookingModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-70 z-50 backdrop-blur-sm"
              onClick={() => setShowBookingModal(false)}
            />
            
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed bottom-0 left-0 right-0 bg-gray-900 rounded-t-2xl border-t border-gray-700 z-50 p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4">Quick Book</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => {
                    navigate('/');
                    setShowBookingModal(false);
                  }}
                  className="bg-gray-800 hover:bg-gray-700 p-4 rounded-xl flex flex-col items-center"
                >
                  <img src={footballIcon} className="w-10 h-10 mb-2" alt="Football" />
                  <span>Football</span>
                </button>
                
                <button 
                  onClick={() => {
                    navigate('/');
                    setShowBookingModal(false);
                  }}
                  className="bg-gray-800 hover:bg-gray-700 p-4 rounded-xl flex flex-col items-center"
                >
                  <img src={cricketIcon} className="w-10 h-10 mb-2" alt="Cricket" />
                  <span>Cricket</span>
                </button>
                
                <button 
                  onClick={() => {
                    navigate('/');
                    setShowBookingModal(false);
                  }}
                  className="bg-gray-800 hover:bg-gray-700 p-4 rounded-xl flex flex-col items-center"
                >
                  <img src={badmintonIcon} className="w-10 h-10 mb-2" alt="Badminton" />
                  <span>Badminton</span>
                </button>
                
                <button 
                  onClick={() => {
                    navigate('/');
                    setShowBookingModal(false);
                  }}
                  className="bg-gray-800 hover:bg-gray-700 p-4 rounded-xl flex flex-col items-center"
                >
                  <Plus className="w-10 h-10 mb-2 text-gray-400" />
                  <span>Other</span>
                </button>
              </div>
              
              <button 
                onClick={() => setShowBookingModal(false)}
                className="w-full mt-6 py-3 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNav;

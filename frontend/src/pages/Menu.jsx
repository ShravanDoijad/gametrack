import React, { useContext, useState } from "react";
import { Home, CalendarDays, Heart, User, Plus, CalendarClock  } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { BookContext } from "../constexts/bookContext";
import TurfSwitcher from "../components/TurfSwitcher";

const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, userInfo, turfs } = useContext(BookContext);
  const [showBookingModal, setShowBookingModal] = useState(false);


  
const commonTabs = [
  { 
    id: 'home',
    icon: <Home size={22} />,
    label: 'Turfs',
    path: userInfo?.role==='user'?'/': '/owner/dashboard',
    active: location.pathname === '/'
  },
  
  { 
    id: 'profile',
    icon: <User size={22} />,
    label: 'Profile',
    path: token ? '/profile' : '/register',
    active: location.pathname.includes('profile') || location.pathname.includes('login')
  },
];


if (userInfo?.role === 'owner') {
  commonTabs.splice(2, 0, {
    id: 'timeSlots',
    icon: <CalendarClock size={22} />,
    label: 'Time Manager',
    path: '/owner/time-slots',
    active: location.pathname.includes('owner/time-slots')
  });
  commonTabs.splice(1, 0 ,{
    id: 'bookings',
    icon: <CalendarDays size={22} />,
    label: 'Bookings',
    path: '/owner/turfTodaysbookings',
    active: location.pathname.includes('owner/turfTodaysbookings')
  }  )
} else {

  commonTabs.splice(1, 0 ,{
    id: 'bookings',
    icon: <CalendarDays size={22} />,
    label: 'Bookings',
    path: '/userbookings',
    active: location.pathname.includes('userbookings')
  }  )

}



  return (
    <>
     
      <nav className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 z-50">
        <div className="flex items-center justify-around h-16 px-2 bg-gray-950/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {commonTabs.map((tab) => (
            <React.Fragment key={tab.id}>
              
                <button
                  onClick={() => navigate(tab.path)}
                  className={`flex flex-col items-center justify-center w-full h-full relative transition-all duration-300 ${tab.active ? 'text-lime-400 scale-110' : 'text-gray-500 hover:text-gray-300 hover:scale-105'}`}
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
                  <span className={`text-[10px] mt-1 font-medium ${tab.active ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>{tab.label}</span>
                </button>
                
            
            </React.Fragment>
          ))}
          {token && userInfo.role ==="owner" && turfs.length> 1&& <TurfSwitcher/>}
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
                    navigate('/booking', { state: { sport: 'football' } });
                    setShowBookingModal(false);
                  }}
                  className="bg-gray-800 hover:bg-gray-700 p-4 rounded-xl flex flex-col items-center"
                >
                  <img src={footballIcon} className="w-10 h-10 mb-2" alt="Football" />
                  <span>Football</span>
                </button>
                
                <button 
                  onClick={() => {
                    navigate('/booking', { state: { sport: 'cricket' } });
                    setShowBookingModal(false);
                  }}
                  className="bg-gray-800 hover:bg-gray-700 p-4 rounded-xl flex flex-col items-center"
                >
                  <img src={cricketIcon} className="w-10 h-10 mb-2" alt="Cricket" />
                  <span>Cricket</span>
                </button>
                
                <button 
                  onClick={() => {
                    navigate('/booking', { state: { sport: 'badminton' } });
                    setShowBookingModal(false);
                  }}
                  className="bg-gray-800 hover:bg-gray-700 p-4 rounded-xl flex flex-col items-center"
                >
                  <img src={badmintonIcon} className="w-10 h-10 mb-2" alt="Badminton" />
                  <span>Badminton</span>
                </button>
                
                <button 
                  onClick={() => {
                    navigate('/booking');
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
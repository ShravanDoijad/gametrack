import React, { useState, useContext } from 'react';
import { Bell, LogOut, User, ChevronDown, Sun, Moon, Settings } from 'lucide-react';
import { BookContext } from '../constexts/bookContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const { setmenuPanel, token, handleLogout, setloginPanel, userInfo } = useContext(BookContext);
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="sora px-6 py-4 text-white flex justify-between items-center border-b border-gray-800 bg-gradient-to-r from-gray-900/80 to-gray-950/80 backdrop-blur-lg z-50"
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/')}
        className="cursor-pointer"
      >
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-500">
          Game<span className="text-white">Track</span>
        </h1>
      </motion.div>


      <div className="flex items-center gap-4 md:gap-6">

        <div className="relative">
          <button
            onClick={() => token ? navigate('/notification') : setloginPanel(true)}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors relative"
          >
            <Bell className="text-gray-200" size={20} />
            {token && userInfo?.unreadNotifications > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
              >
                {userInfo.unreadNotifications}
              </motion.span>
            )}
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 hover:bg-gray-800 rounded-full p-1 pr-3 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
              {token ? (

                <span className="font-medium text-white">
                  {userInfo?.fullname?.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User className="text-white" size={16} />
              )}
            </div>
            {token && (
              <ChevronDown
                className={`text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                size={16}
              />
            )}
          </button>

          {/* Dropdown menu */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-100"
              >
                {token ? (
                  <>
                    <div className="px-4 py-3 border-b  border-gray-700">
                      <p className="text-sm font-medium text-white">{userInfo?.fullname}</p>
                      <p className="text-xs text-gray-400 truncate">{userInfo?.email}</p>
                      {userInfo?.role === "owner" && (
                        <span className="text-[11px] text-amber-400 bg-amber-600/20 px-2 py-0.5 rounded mt-1 inline-block">
                          Turf Owner
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => navigate('/profile')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <User size={16} className="text-gray-400" />
                      My Profile
                    </button>
                    {userInfo?.role === "owner" && (
                      <button
                        onClick={() => navigate('/owner/dashboard')}
                        className="w-full px-4 py-2 text-left text-sm text-lime-400 hover:bg-gray-700 transition-colors flex items-center gap-2"
                      >
                        Owner Dashboard
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 transition-colors flex items-center gap-2 border-t border-gray-700"
                    >
                      <LogOut size={16} className="text-red-400" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setloginPanel(true);
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-sm text-center text-white bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 transition-colors"
                  >
                    Sign In / Register
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
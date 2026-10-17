import { useEffect, useRef, useState, useContext } from 'react';
import { Bell, LogOut, User, ChevronDown, Menu, Home, UserRound, ShieldCheck, Compass } from 'lucide-react';
import { BookContext } from '../constexts/bookContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useProductTour } from '../contexts/ProductTourContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { token, handleLogout, userInfo, toggleSidebar, setloginPanel } = useContext(BookContext);
  const { startTour } = useProductTour();
  const [showDropdown, setShowDropdown] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!accountRef.current?.contains(event.target)) setShowDropdown(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setShowDropdown(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const goTo = (path) => {
    setShowDropdown(false);
    navigate(path);
  };
  const goHome = () => goTo('/');

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative z-50 flex items-center justify-between border-b border-white/10 bg-gray-950/85 px-4 py-3 text-white shadow-lg shadow-black/10 backdrop-blur-xl sm:px-6 sm:py-4"
    >
      <button type="button" onClick={goHome} className="rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400" aria-label="GameTrack home">
        <span className="bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-xl font-extrabold tracking-tight text-transparent sm:text-2xl">
          Game<span className="text-white">Track</span>
        </span>
      </button>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => token ? navigate('/notification') : setloginPanel(true)}
          className="relative flex h-11 w-11 items-center justify-center rounded-full text-gray-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"
          aria-label={token ? 'Notifications' : 'Log in to view notifications'}
        >
          <Bell size={20} />
          {token && userInfo?.unreadNotifications > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
              {userInfo.unreadNotifications}
            </span>
          )}
        </button>

        <div className="relative" ref={accountRef}>
          <button
            type="button"
            onClick={() => setShowDropdown((open) => !open)}
            aria-expanded={showDropdown}
            aria-haspopup="menu"
            aria-label={token ? 'Open account menu' : 'Open account and log in menu'}
            data-tour="login-button"
            className={`flex h-11 items-center gap-2 rounded-full border px-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 sm:pl-1.5 sm:pr-3 ${showDropdown ? 'border-lime-400/60 bg-white/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-lime-300 to-emerald-500 text-gray-950 shadow-md shadow-lime-500/20">
              {token ? <span className="font-bold">{userInfo?.fullname?.charAt(0).toUpperCase() || <User size={17} />}</span> : <User size={17} />}
            </span>
            <ChevronDown className={`hidden text-gray-300 transition-transform sm:block ${showDropdown ? 'rotate-180' : ''}`} size={16} />
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                role="menu"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                className="absolute right-0 top-[calc(100%+0.65rem)] z-[60] w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-white/10 bg-gray-900 shadow-2xl shadow-black/40 ring-1 ring-white/5"
              >
                {token ? (
                  <>
                    <div className="border-b border-white/10 bg-gradient-to-br from-lime-400/10 to-transparent px-5 py-4">
                      <p className="truncate text-sm font-bold text-white">{userInfo?.fullname || 'GameTrack member'}</p>
                      <p className="mt-0.5 truncate text-xs text-gray-400">{userInfo?.phone ? `+91 ${userInfo.phone}` : userInfo?.email}</p>
                      {userInfo?.role === 'owner' && <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300"><ShieldCheck size={13} /> Turf owner</span>}
                    </div>
                    <button type="button" role="menuitem" onClick={goHome} className="flex min-h-12 w-full items-center gap-3 px-5 text-left text-sm font-medium text-gray-200 transition hover:bg-white/5 hover:text-white"><Home size={17} className="text-gray-400" /> Home</button>
                    {userInfo?.role !== 'owner' && <button type="button" role="menuitem" onClick={() => { setShowDropdown(false); startTour(); }} className="flex min-h-12 w-full items-center gap-3 px-5 text-left text-sm font-medium text-gray-200 transition hover:bg-white/5 hover:text-white"><Compass size={17} className="text-lime-400" /> Replay product tour</button>}
                    <button type="button" role="menuitem" onClick={() => goTo('/profile')} className="flex min-h-12 w-full items-center gap-3 px-5 text-left text-sm font-medium text-gray-200 transition hover:bg-white/5 hover:text-white"><UserRound size={17} className="text-gray-400" /> My profile</button>
                    {userInfo?.role === 'owner' && <button type="button" role="menuitem" onClick={() => goTo('/owner/dashboard')} className="flex min-h-12 w-full items-center gap-3 px-5 text-left text-sm font-medium text-gray-200 transition hover:bg-white/5 hover:text-white"><ShieldCheck size={17} className="text-lime-400" /> Owner dashboard</button>}
                    <button type="button" role="menuitem" onClick={(event) => { setShowDropdown(false); handleLogout(event); }} className="flex min-h-12 w-full items-center gap-3 border-t border-white/10 px-5 text-left text-sm font-semibold text-rose-300 transition hover:bg-rose-400/10"><LogOut size={17} /> Log out</button>
                  </>
                ) : (
                  <>
                    <div className="px-5 pb-3 pt-5">
                      <p className="text-base font-bold text-white">Welcome to GameTrack</p>
                      <p className="mt-1 text-sm leading-5 text-gray-400">Log in to manage your bookings and notifications.</p>
                    </div>
                    <button type="button" role="menuitem" onClick={() => { setShowDropdown(false); startTour(); }} className="flex min-h-12 w-full items-center gap-3 px-5 text-left text-sm font-medium text-gray-200 transition hover:bg-white/5 hover:text-white"><Compass size={17} className="text-lime-400" /> Replay product tour</button>
                    <button type="button" role="menuitem" onClick={goHome} className="flex min-h-12 w-full items-center gap-3 px-5 text-left text-sm font-medium text-gray-200 transition hover:bg-white/5"><Home size={17} className="text-gray-400" /> Home</button>
                    <div className="p-3 pt-2">
                      <button type="button" onClick={() => { setShowDropdown(false); setloginPanel(true); }} className="min-h-12 w-full rounded-xl bg-lime-400 px-4 text-sm font-extrabold text-gray-950 shadow-lg shadow-lime-500/10 transition hover:bg-lime-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Log in</button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {token && userInfo?.role === 'owner' && (
          <button type="button" onClick={toggleSidebar} className="flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 lg:hidden" aria-label="Open owner navigation">
            <Menu size={23} />
          </button>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;

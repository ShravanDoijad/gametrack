import { useContext, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';


import Navbar from './components/Navbar';
import Register from './pages/Register';
import OtpVerify from './pages/OtpVerify';
import Menu from './pages/Menu';
import { Notifications } from './pages/Notifications';
import { Turfs } from './pages/Turfs';
import { BookContext } from './constexts/bookContext';
import { Overview } from './pages/Overview';
import PrivateRoute from './PrivateRoute';
import UserBookings from './pages/UserBookings';
import Profile from './pages/Profile';
import Owner from './Owner';
import OwnerPrivateRoute from './OwnerPrivateRoute';
import { Error404 } from './components/Error404';
import { Error403 } from './components/Error403';
import { toast } from "react-toastify"

import BookingManager from './pages/BookingManager';
import BookingConfirmation from './pages/BookingConfirmation';
import ContactUs from './pages/ContactUs';
import { X } from 'lucide-react';

import TurfReview from './pages/TurfReview';
import { ProductTourProvider } from './contexts/ProductTourContext';

const LoginRoute = () => {
  const { setloginPanel } = useContext(BookContext);
  const navigate = useNavigate();

  useEffect(() => {
    setloginPanel(true);
    navigate('/', { replace: true });
  }, [navigate, setloginPanel]);

  return null;
};


function App() {
  const { loginPanel } = useContext(BookContext);
  const [defferedPrompt, setdefferedPrompt] = useState()
  const [installed, setinstalled] = useState(false)

  useEffect(() => {

    const handler = (e) => {
      e.preventDefault();
      setdefferedPrompt(e);
    }

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    }
    
  }, [])

  const handleInstallClick = async () => {
    if(defferedPrompt){
       defferedPrompt.prompt()
      const { outcome } = await defferedPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('App installed');
        setinstalled(true);
      } else {
        toast.error("App installation cancelled");
      }
    }
    else {
      toast.error("App installation not supported on this device");
    }
  
  }

  useEffect(() => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  setinstalled(!!isStandalone);
},[])

  return (
    <ProductTourProvider>
    <div className="flex min-h-[100dvh] w-full flex-col overflow-x-clip bg-gradient-to-b from-gray-900 to-gray-950 pb-20">
      <div className={`${installed ? "hidden" : "grid"} fixed inset-x-0 top-0 z-[120] mx-auto grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2 rounded-b-2xl bg-white px-3 py-2 text-left shadow-lg md:hidden`}>
        <button type="button" onClick={() => setinstalled(true)} aria-label="Dismiss install prompt" className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
          <X size={20} />
        </button>
        <img src="/icons/logo-512.png" alt="GameTrack app" className="h-10 w-10 rounded-xl object-cover" />
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-gray-900">Install GameTrack</h2>
          <p className="truncate text-xs text-gray-600">Get faster access on your device</p>
        </div>
        <button type="button" onClick={handleInstallClick} className="min-h-10 rounded-xl bg-lime-600 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-lime-700 sm:px-4 sm:text-sm">
          Install
        </button>
      </div>
      {loginPanel && <Register />}
      <Navbar />


      <div className="flex-grow ">


        <Routes>
          <Route path="/" element={<Turfs />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route path="/otp" element={<OtpVerify />} />
          <Route path="/overview/:turfId" element={<Overview />} />
          <Route path='/contactUs' element={<ContactUs />} />
          {/* Guests can choose a slot before verifying their phone. */}
          <Route path="/booking" element={<BookingManager />} />
          <Route path="/booking/:turfId" element={<BookingManager />} />

          <Route element={<PrivateRoute />}>
            <Route path="/review" element={<TurfReview />} />
            <Route path="/booking/confirmation/:bookingId" element={<BookingConfirmation />} />
            <Route path="/notification" element={<Notifications />} />
            <Route path="/userBookings" element={<UserBookings />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="/forbidden" element={<Error403 />} />

          <Route element={<OwnerPrivateRoute />}>
            <Route path="/owner/*" element={<Owner />} />
          </Route>


          <Route path="*" element={<Error404 />} />
        </Routes>
      </div>

      <Menu />
    </div>
    </ProductTourProvider>
  );
}


export default App;

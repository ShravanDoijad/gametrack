import { useContext, useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';


import Navbar from './components/Navbar';
import Register from './pages/Register';
import OtpVerify from './pages/OtpVerify';
import Menu from './pages/Menu';
import { Notifications } from './pages/Notifications';
import { Turfs } from './pages/Turfs';
import { BookContext } from './constexts/bookContext';
import { Overview } from './pages/Overview';
import axios from 'axios'
import Favorite from './pages/Favorite';
import PrivateRoute from './PrivateRoute';
import UserBookings from './pages/UserBookings';
import Profile from './pages/Profile';
import PushNotifier from './components/PushNotifier';
import Owner from './Owner';
import OwnerPrivateRoute from './OwnerPrivateRoute';
import { Error404 } from './components/Error404';
import { Error403 } from './components/Error403';
import TurfSwitcher from './components/TurfSwitcher';
import { toast } from "react-toastify"

import BookingManager from './pages/BookingManager';
import ContactUs from './pages/ContactUs';
import { X } from 'lucide-react';

function App() {
  const { loginPanel, token, userInfo, isLoading, hasCheckedAuth } = useContext(BookContext);
  const [showSplash, setShowSplash] = useState(true);
  const [pendingReviews, setpendingReviews] = useState([])
  const [defferedPrompt, setdefferedPrompt] = useState()
  const [installed, setinstalled] = useState(false)

  const navigate = useNavigate()

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

  useEffect(() => {
    if (token && userInfo?.role === "user") {
      getPendingReviews();
    }
  }, [token, userInfo]);




  useEffect(() => {
    if (pendingReviews.length > 0) {
      const { bookingId, turfId } = pendingReviews[0];
      navigate(`/review?turfId=${turfId}&bookingId=${bookingId}`);
    }
  }, [pendingReviews]);


  const getPendingReviews = async () => {
    try {
      const response = await axios.get("/api/users/pendingReview");
      if (response.data.success) {
        await setpendingReviews(response.data.pendingReviews)
      }
    }
    catch (error) {
      console.log("error", error)
      toast.error(error.response?.data?.message || "Internal server error")
    }
  }


useEffect(() => {
  if (isLoading ) {
    setShowSplash(true);
  }
}, [isLoading]);



  return (
    <div className="max-w-screen min-h-[92vh] bg-gradient-to-b pb-20 from-gray-900 to-gray-950 box-border flex flex-col">
      <div className={`flex  fixed z-100 items-center ${installed? "hidden" :"block"} px-2 py-1 md:hidden bg-white shadow-md w-full max-w-sm mx-auto text-center`}>
      <X onClick={()=>setinstalled(true)} className=' text-gray-500 mb-10 mt-1 '  size={25}/>
      <img
        src="/icons/logo-512.png" // replace with your logo path
        alt="App Logo"
        className="w-15 h-15 "
      />
      


      <div className='flex flex-col  justify-center  items-center ml-2'>
      <h2 className="text-sm sora font-semibold ">Install Our App</h2>
      <p className="text-gray-600 text-xs ">
        Get faster access and smoother experience
      </p>
      </div>

      {/* Button */}
      <button
      onClick={handleInstallClick}
        className="bg-lime-600 hover:bg-lime-600 text-white font-semibold text-sm px-2 py-2 rounded-xl shadow-md"
      >
        Install App
      </button>
    </div>
      {loginPanel && <Register />}
      {token && userInfo?.role === "user" && <PushNotifier userId={userInfo._id} type="user" />}
      {token && userInfo?.role === "owner" && <PushNotifier ownerId={userInfo._id} type="owner" />}

      <Navbar />


      <div className="flex-grow ">


        <Routes>
          <Route path="/" element={<Turfs />} />
          <Route path="/register" element={<Register />} />
          <Route path="/otp" element={<OtpVerify />} />
          <Route path="/overview/:turfId" element={<Overview />} />
          <Route path='/contactUs' element={<ContactUs />} />

          <Route element={<PrivateRoute />}>
            <Route path="/booking" element={<BookingManager />} />
            <Route path="/notification" element={<Notifications />} />
            <Route path="/favorite" element={<Favorite />} />
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
  );
}


export default App;

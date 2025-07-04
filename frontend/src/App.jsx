import { useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { toast } from "react-toastify"
import './App.css';
import { messaging } from "./firebase"
import Home from './pages/Home';
import Navbar from './components/Navbar';
import Register from './pages/Register';
import OtpVerify from './pages/OtpVerify';
import Menu from './pages/Menu';
import { Notifications } from './pages/Notifications';
import { Turfs } from './pages/Turfs';
import { BookContext } from './constexts/bookContext';
import { Overview } from './pages/Overview';
import Booking from './pages/Booking';
import Favorite from './pages/Favorite';
import PrivateRoute from './PrivateRoute';
import UserBookings from './pages/UserBookings';
import Profile from './pages/Profile';
import axios from "axios"
import { getToken } from 'firebase/messaging';
function App() {
  const { menuPanel, loginPanel, token, userInfo } = useContext(BookContext);

  async function requestPermission() {
   
    const permission = await Notification.requestPermission()
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey:
          "BPTspQidZqvae_uXxp2dkSa3SZFVBb6J5nQxzADibW2mrx7d67lkjcJG5xlwTPYjzBD6wfsWxjME6uisDiCdMH4"
      })
      try{
      await axios.post("/notifications/save-token", {
        userId: userInfo._id,
        fcmToken: token
      });}
      catch(error){
        console.log("Token saving Error", error);
      }
    }
    else if (permission === "denied") {
      toast.warn("You denied important Notifications")
    }
  }

  useEffect(() => {
    if (userInfo?._id) {
    requestPermission();
  }
  }, [userInfo])




  return (
    <div className="max-w-screen min-h-screen bg-gradient-to-b pb-20 from-gray-900 to-gray-950 box-border flex flex-col">
      {menuPanel && <Menu />}
      {loginPanel && !token && <Register />}

      <Navbar />

      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/turfs" element={<Turfs />} />
          <Route path='/login' element={<Register />} />
          <Route path="/otp" element={<OtpVerify />} />
          <Route path="/overview/:turfId" element={<Overview />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/booking" element={<Booking />} />
            <Route path="/notification" element={<Notifications />} />
            <Route path="/favorite" element={<Favorite />} />
            <Route path="/userBookings" element={<UserBookings />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </div>
      <Menu />
    </div>
  );
}

export default App;
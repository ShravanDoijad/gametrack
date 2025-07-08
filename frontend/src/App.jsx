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
import Owner from './Owner';
function App() {
  const { menuPanel, loginPanel, token, userInfo } = useContext(BookContext);

  const navigate = useNavigate();
  const askForPermission = () => {
    window.OneSignal = window.OneSignal || [];
    window.OneSignal.push(function () {
      window.OneSignal.showSlidedownPrompt(); // 🔔 Ask manually
    });
  };

  const getPlayerId = () => {
    window.OneSignal = window.OneSignal || [];
    window.OneSignal.push(function () {
      window.OneSignal.getUserId(function (userId) {
        console.log("Player ID:", userId);
             axios.post("/api/users/updateUser", {
              userId: userInfo._id,
              playerId: playerId,
      });
      });
    });
  };

  useEffect(() => {
    // Optional: Automatically ask for permission on mount
    // askForPermission();

    // Optional: Get player ID automatically
    getPlayerId();
  }, []);




  return (
    <div className="max-w-screen bg-gradient-to-b pb-20 from-gray-900 to-gray-950 box-border flex flex-col">
      {menuPanel && <Menu />}
      {loginPanel && !token && <Register />}

      <Navbar />
      <div className='flex justify-between items-center p-4 bg-gray-800 text-white z-100'>
      <h1>Push Notification Demo</h1>
      <button onClick={askForPermission}>Enable Notifications</button>
    </div>

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


          <Route path="/owner/*" element={<Owner />} />

        </Routes>
      </div>
      <Menu />
    </div>
  );
}

export default App;
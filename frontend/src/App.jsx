import { useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { toast } from "react-toastify"
import './App.css';

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
import PushNotifier from './components/PushNotifier';

import Owner from './Owner';
import SendTestPush from './components/SendTestPush';
function App() {
   const [fcmToken, setFcmToken] = useState(null);
  const { loginPanel, token, userInfo } = useContext(BookContext);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    import("./firebase-messaging").then(({ requestPermission }) => {
      requestPermission().then((token) => {
        setFcmToken(token);
      });
    });
  }, [fcmToken]);


  console.log("User Info:", userInfo);
  return (
    <div className="max-w-screen bg-gradient-to-b pb-20 from-gray-900 to-gray-950 box-border flex flex-col">
      
      {loginPanel && !token && <Register />}
      {token && userInfo && userInfo.role==="user" &&  <PushNotifier userId={userInfo._id} type="user" /> }
      {fcmToken && <SendTestPush playerToken={fcmToken} />}


      <Navbar />
     

      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/turfs" element={<Turfs />} />
          <Route path='/register' element={<Register />} />
          

          <Route path="/otp" element={<OtpVerify />} />
          <Route path="/overview/:turfId" element={<Overview />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/booking" element={<Booking />} />
            <Route path="/notification" element={<Notifications />} />
            <Route path="/favorite" element={<Favorite />} />
            <Route path="/userBookings" element={<UserBookings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/testpush" element={<SendTestPush />} />
            
          </Route>


          <Route path="/owner/*" element={<Owner />} />

        </Routes>
      </div>
      <Menu />
    </div>
  );
}

export default App;
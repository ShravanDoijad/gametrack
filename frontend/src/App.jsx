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
import Booking from './pages/Booking';
import Favorite from './pages/Favorite';
import PrivateRoute from './PrivateRoute';
import UserBookings from './pages/UserBookings';
import Profile from './pages/Profile';
import PushNotifier from './components/PushNotifier';
import Owner from './Owner';
import OwnerPrivateRoute from './OwnerPrivateRoute';

function App() {
  const { loginPanel, token, userInfo, isLoading } = useContext(BookContext);
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Ensure splash stays for at least 4 seconds even if isLoading finishes
    const timer = setTimeout(() => {
      setShowSplash(false);
      if (!token) {
        navigate("/");
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [isLoading]);

  if (isLoading || showSplash) {
    
      <div className="min-h-screen flex flex-col items-center justify-center bg-black">
        <img
          src="/gametrack.jpg"
          alt="GameTrack Logo"
          className="w-28 h-28 animate-bounce rounded-full shadow-lg"
        />
        <p className="text-white mt-4 animate-pulse text-sm tracking-wider">Preparing your arena...</p>
      </div>
    
  }

  return (
    <div className="max-w-screen min-h-[80vh] bg-gradient-to-b pb-20 from-gray-900 to-gray-950 box-border flex flex-col">
      {loginPanel && !token && <Register />}
      {token && userInfo?.role === "user" && <PushNotifier userId={userInfo._id} type="user" />}
      {token && userInfo?.role === "owner" && <PushNotifier ownerId={userInfo._id} type="owner" />}

      <Navbar />

      <div className="flex-grow mt-6">
        <Routes>
         
          <Route path="/" element={<Turfs />} />
          <Route path="/register" element={<Register />} />
          <Route path="/otp" element={<OtpVerify />} />
          <Route path="/overview/:turfId" element={<Overview />} />

          {/* Protected User Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/booking" element={<Booking />} />
            <Route path="/notification" element={<Notifications />} />
            <Route path="/favorite" element={<Favorite />} />
            <Route path="/userBookings" element={<UserBookings />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Protected Owner Routes */}
          <Route element={<OwnerPrivateRoute />}>
            <Route path="/owner/*" element={<Owner />} />
          </Route>
        </Routes>
      </div>

      <Menu />
    </div>
  );
}

export default App;

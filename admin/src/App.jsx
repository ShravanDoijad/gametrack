import { useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import AdminLogin from './pages/AdminLogin';
import AddTurf from './pages/AddTurf';
import AddOwner from './pages/AddOwner';
import Dashboard from './pages/Dashboard';
import axios from 'axios';
import User from './pages/User';
import Bookings from './pages/Bookings';


function App() {
  const [token, settoken] = useState(false)
  const [loading, setloading] = useState(true)
  const authCheck = async() =>{
   
    try {
      const adminAuthRes= await axios.get("/admin/adminAuth")
      if( adminAuthRes.data?.message === "Authorized"){
        settoken(true)
      }
      else{
        settoken(false)
      }
    } catch (error) {
      console.log("Admin not authenticated", error)

    }
    finally{
      setloading(false)
    }

  }

  useEffect(()=>{
    authCheck()
  }
  ,[])

  if(loading){
    return <div className="min-h-screen flex items-center justify-center bg-gray-100
    px-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
            <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800">Loading
            </h2>
            <p className="text-gray-600 mt-2">Please wait while we log you in...</p>
        </div>
    </div>
  }

  return (
    
      <div
        className="max-w-screen min-h-screen box-border flex flex-col">
        <div className="flex-grow">
          
            {!token && <AdminLogin /> }
            
          <Routes>
            <Route path='/' element={token ? <Dashboard/> : <AdminLogin/>} />
            <Route path='/addTurf' element={<AddTurf/>} />
            <Route path='/addOwner' element={<AddOwner/>} />
            <Route path='/dashboard' element={<Dashboard/>} /> 
            <Route path='/users' element={<User/>} />
            <Route path='/bookings' element={<Bookings/>} />

          </Routes>

          
        </div>
      </div>
    
  );
}

export default App;

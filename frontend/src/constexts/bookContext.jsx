import React, { createContext } from 'react';
import { useState, useEffect } from 'react';
export const BookContext = createContext();
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const BookContextProvider = ({ children }) => {
    const navigate = useNavigate()
    const [isLoading, setisLoading] = useState(false)
    const [userInfo, setuserInfo] = useState()
    const [selectedSport, setSelectedSport] = useState("");
    const [token, settoken] = useState(false)
    const [favorite, setfavorite] = useState()
    const [loginPanel, setloginPanel] = useState(false)
    const [menuPanel, setmenuPanel] = useState(false)
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
    const [turfs, setTurfs] = useState([]);
    const [selectedTurfId, setSelectedTurfId] = useState(turfs._id);
    const [bookings, setbookings] = useState([])
     const [sidebarOpen, setSidebarOpen] = useState(false);
    
      const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
      const closeSidebar = () => setSidebarOpen(false);
    
   useEffect(() => {
  if (token && userInfo?.role === 'owner' && selectedTurfId) {
    setisLoading(true);
    const fetchBookings = async () => {
      try {
        const response = await axios.get(`/owner/turfAllBookings?turfId=${selectedTurfId}`);
        setbookings(response.data.bookings);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        toast.error("Failed to fetch bookings");
      } finally {
        setisLoading(false);
      }
    };
    fetchBookings();
  }
}, [token, userInfo, selectedTurfId]);



    const fetchToken = async () => {
        setisLoading(true);
        try {
            const userRes = await axios.get(`/api/auth/authCheck`, {
                withCredentials: true,
            });

            if (userRes.data.success) {
                settoken(true);
                setuserInfo({
                    ...userRes.data.user,
                    role: userRes.data.role,
                });
            } else {
                settoken(false);
                setuserInfo(null);
            }
        } catch (error) {
            console.log(error)
            settoken(false);
            setuserInfo(null);
        } finally {
            setisLoading(false);
            setHasCheckedAuth(true);
        }
    };


    useEffect(() => {
        fetchToken()
    }, [])




    const handleLogout = async (e) => {
        e.preventDefault()
        try {

            const response = await axios.post('/api/users/userLogout', {
                role: userInfo.role
            });

            settoken(false);
            setmenuPanel(false);
            navigate('/turfs');

        } catch (error) {
            console.error("Error during logout:", error);
        }
    };


    
     useEffect(() => {
       
        const fetchTurfs = async () => {
          try {
            const response = await axios.get('/owner/ownedTurfs');
            console.log("response", response);
            
            setTurfs(response.data.turfs || []);
            if (response.data.turfs.length > 0) {
              setSelectedTurfId(response.data.turfs[0]._id);
             
            }
          } catch (error) {
            console.error('Failed to fetch turfs:', error);
          } 
        };
         if(token && userInfo.role === "owner"){
        fetchTurfs();
         }
      }, [token, userInfo]);

      useEffect(()=>{
         selectedTurfId && localStorage.setItem("selectedTurf", selectedTurfId)
      }, [selectedTurfId])

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    let backendUrl = import.meta.env.VITE_BACKEND;
    const value = {
        backendUrl,
        menuPanel,
        setmenuPanel,
        setloginPanel,
        handleLogout,
        bookings,
        setbookings,
        loginPanel,
        settoken,
        token,
        favorite,
        setfavorite,
        isLoading,
        setisLoading,
        selectedSport,
        setSelectedSport,
        userInfo,
        setuserInfo,
        calculateDistance,
        fetchToken,
        hasCheckedAuth,
        selectedTurfId,
        setSelectedTurfId,
        setTurfs,
        turfs,
        toggleSidebar, 
        sidebarOpen,
        closeSidebar

    }
    return (
        <BookContext.Provider value={value}>
            {children}
        </BookContext.Provider>
    )
}

export default BookContextProvider; 
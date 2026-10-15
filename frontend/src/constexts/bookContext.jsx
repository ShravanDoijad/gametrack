/* eslint-disable react/prop-types */
import { createContext } from 'react';
import { useState, useEffect, useCallback } from 'react';
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
    const [selectedTurfId, setSelectedTurfId] = useState(null);
    const [bookings, setbookings] = useState([])
    const [ownerBookingsLoading, setOwnerBookingsLoading] = useState(false);
     const [sidebarOpen, setSidebarOpen] = useState(false);
    
    const [cancelled, setCancelled] = useState(false);
      const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
      const closeSidebar = () => setSidebarOpen(false);
    
    const refreshOwnerData = useCallback(async () => {
        if (!token || userInfo?.role !== 'owner' || !selectedTurfId) return;
        setOwnerBookingsLoading(true);
        try {
            const [bookingsResponse, turfsResponse] = await Promise.all([
                axios.get(`/owner/turfAllBookings?turfId=${selectedTurfId}`),
                axios.get('/owner/ownedTurfs'),
            ]);
            setbookings(bookingsResponse.data.bookings || []);
            setTurfs(turfsResponse.data.turfs || []);
        } catch (error) {
            console.error("Failed to refresh owner bookings and availability:", error);
            toast.error("Could not refresh owner bookings. Please try again.");
        } finally {
            setOwnerBookingsLoading(false);
        }
    }, [token, userInfo?.role, selectedTurfId]);

    useEffect(() => {
        refreshOwnerData();
    }, [refreshOwnerData, cancelled]);


    const fetchToken = async () => {
        setisLoading(true);
        try {
            const userRes = await axios.get(`/api/auth/authCheck`, {
                withCredentials: true,
            });

            if (userRes.data.success) {
                settoken(true);
                const authenticatedUser = {
                    ...userRes.data.user,
                    role: userRes.data.role,
                };
                setuserInfo(authenticatedUser);
                return authenticatedUser;
            } else {
                settoken(false);
                setuserInfo(null);
                return null;
            }
        } catch (error) {
            console.error("Authentication check failed", error.message);
            settoken(false);
            setuserInfo(null);
            return null;
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

            await axios.post('/api/users/userLogout', {
                role: userInfo.role
            });

            settoken(false);
            setuserInfo(null);
            setbookings([]);
            setTurfs([]);
            setSelectedTurfId(null);
            setmenuPanel(false);
            setSidebarOpen(false);
            navigate('/');

        } catch (error) {
            console.error("Error during logout:", error);
        }
    };


    
     useEffect(() => {
       
        const fetchTurfs = async () => {
          try {
            const response = await axios.get('/owner/ownedTurfs');
            console.log("response", response);
            
            const ownedTurfs = response.data.turfs || [];
            setTurfs(ownedTurfs);
            let savedId = null;
            try { savedId = localStorage.getItem("ownerSelectedTurf"); } catch { /* Storage is optional. */ }
            const resolvedId = ownedTurfs.some((turf) => turf._id === savedId) ? savedId : ownedTurfs[0]?._id || null;
            setSelectedTurfId(resolvedId);
          } catch (error) {
            console.error('Failed to fetch turfs:', error);
          } 
        };
         if(token && userInfo?.role === "owner"){
        fetchTurfs();
         }
      }, [token, userInfo]);

     useEffect(()=>{
         if (!selectedTurfId || userInfo?.role !== "owner") return;
         try { localStorage.setItem("ownerSelectedTurf", selectedTurfId); } catch { /* Storage is optional. */ }
      }, [selectedTurfId, userInfo?.role])

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
        refreshOwnerData,
        ownerBookingsLoading,
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
        closeSidebar,
        cancelled,
        setCancelled
    }
    return (
        <BookContext.Provider value={value}>
            {children}
        </BookContext.Provider>
    )
}

export default BookContextProvider;

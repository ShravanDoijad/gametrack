import React, { createContext } from 'react';
import { useState, useEffect } from 'react';
export const BookContext = createContext();
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const BookContextProvider = ({ children }) => {
    const navigate = useNavigate()
    const [isLoading, setisLoading] = useState(true)
    const [userInfo, setuserInfo] = useState()
    const [selectedSport, setSelectedSport] = useState("");
    const [token, settoken] = useState(false)
    const [favorite, setfavorite] = useState()
    const [loginPanel, setloginPanel] = useState(false)
    const [menuPanel, setmenuPanel] = useState(false)
    const [bookings, setbookings] = useState([])

    useEffect(() => {
        if (token && userInfo && userInfo.role === 'owner') {
            setisLoading(true);
            const fetchBookings = async () => {
                try {
                    const response = await axios.get('/owner/turfAllBookings');
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
    }, [token, userInfo]);


    const fetchToken = async () => {
        try {

            const userRes = await axios.get(`/api/auth/authCheck`, { withCredentials: true });
            if (userRes.data.success) {
                settoken(userRes.data.isToken);
                setuserInfo({
                    ...userRes.data.user,
                    role: userRes.data.role,
                });
                return;
            }
        } catch (error) {
            console.warn("User not authenticated, checking owner...");
        }
        finally {
            setisLoading(false);
        }

        try {

            const ownerRes = await axios.get(`/api/auth/ownerAuthCheck`, { withCredentials: true });
            if (ownerRes.data.success) {
                settoken(ownerRes.data.isToken);
                setuserInfo({
                    ...ownerRes.data.owner,
                    role: ownerRes.data.role,
                });
                return;
            }
        } catch (error) {
            console.warn("Owner not authenticated either.");
        }
        finally {
            setisLoading(false);
        }


        settoken(false);
        setuserInfo(null);
        console.warn("No valid session found.");
        setisLoading(false);
    };
    useEffect(() => {
        fetchToken()
    }, [])




    const handleLogout = async (e) => {
        e.preventDefault()
        try {

            const response = await axios.post('/api/users/userLogout',{
                role: userInfo.role
            });

            settoken(false);
            setmenuPanel(false);
            navigate('/turfs');

        } catch (error) {
            console.error("Error during logout:", error);
        }
    };


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
        fetchToken

    }
    return (
        <BookContext.Provider value={value}>
            {children}
        </BookContext.Provider>
    )
}

export default BookContextProvider; 
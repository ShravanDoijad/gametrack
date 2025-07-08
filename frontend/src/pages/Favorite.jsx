import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useContext } from 'react';
import { BookContext } from '../constexts/bookContext';
import axios from 'axios';
import { toast } from 'react-toastify';


const Favorite = () => {
   const [isLoading, setisLoading] = useState(false);
  const [favoriteTurfs, setfavoriteTurfs] = useState([])
  const getFavoriteTurfs = async () => {
    setisLoading(true);
    try {
      const response = await axios.get('/api/users/getFavoriteTurfs');
      
      if (response.data.success) {
        setfavoriteTurfs(response.data.favoriteTurfs);
      }

    } catch (error) {
      toast.error("Failed to fetch favorite turfs");
      console.error("Error fetching favorite turfs:", error.response?.data?.message || error.message);
    }
    finally {
      setisLoading(false);
    }
  }

  useEffect(() => {
    getFavoriteTurfs();
  }, []);


  const navigate = useNavigate();

  const handleNavigate = (id) => {
    navigate(`/overview/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

 
  return (
    <div className="p-4 min-h-screen   transition-colors duration-300">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Your Favorite Turfs</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {
          favoriteTurfs.length === 0 && (
            <div className="col-span-1 sm:col-span-2 mt-10 md:col-span-3 text-center text-gray-500 dark:text-gray-400">
              No favorite turfs found.
            </div>
          )
        }
        {favoriteTurfs.map((turf) => (
          <div
            key={turf._id}
            onClick={() => handleNavigate(turf._id)}
            className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow dark:shadow-md hover:scale-[1.02] transition cursor-pointer"
          >
            <div className="relative">
              <img
                src={turf.images[0]}
                alt={turf.name}
                className="w-full h-48 object-cover rounded-t-xl"
              />
              <Heart
                className="absolute top-3 right-3 text-red-500 fill-red-500"
                size={22}
              />
            </div>
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{turf.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{turf.location.address}</p>
              <p className="text-sm mt-1 text-yellow-600 font-semibold">
                ⭐ {turf.rating}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Favorite;

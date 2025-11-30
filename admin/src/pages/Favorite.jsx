import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, ChevronRight, Bookmark } from 'lucide-react';
import { BookContext } from '../constexts/bookContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import SkeletonLoader from '../components/SkeletonLoader';

const Favorite = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [favoriteTurfs, setFavoriteTurfs] = useState([]);
  const { calculateDistance, location } = useContext(BookContext);
  const navigate = useNavigate();

  const getFavoriteTurfs = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/users/getFavoriteTurfs');
      
      if (response.data.success) {
        const turfsWithDetails = response.data.favoriteTurfs.map(turf => ({
          ...turf,
          distance: location ? calculateDistance(
            location.latitude,
            location.longitude,
            turf.location.coordinates[0],
            turf.location.coordinates[1]
          ) : null,
          priceRange: turf.dayPrice && turf.nightPrice 
            ? `${Math.min(turf.dayPrice, turf.nightPrice)} - ${Math.max(turf.dayPrice, turf.nightPrice)}` 
            : turf.dayPrice || turf.nightPrice || 'N/A'
        }));
        setFavoriteTurfs(turfsWithDetails);
      }
    } catch (error) {
      toast.error("Failed to fetch favorite turfs");
      console.error("Error fetching favorite turfs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromFavorites = async (turfId, e) => {
    e.stopPropagation();
    
    try {
      setIsLoading(true);
      const response = await axios.post(`/api/users/removeFavoriteTurf`,{turfId:turfId});
      
      if (response.data.success) {
        toast.success("Removed from favorites");
        setFavoriteTurfs(prev => prev.filter(turf => turf._id !== turfId));
      }
    } catch (error) {
      toast.error("Failed to remove from favorites");
      console.error("Error removing favorite:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getFavoriteTurfs();
  }, [location]);

  const handleNavigate = (id) => {
    navigate(`/overview/${id}`);
  };

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="w-full min-h-screen px-4 sm:px-6 py-8">
  <div className="max-w-7xl mx-auto">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
      <div>
        <h1 className="text-3xl font-bold text-white">Saved Turfs</h1>
        <p className="text-gray-400 mt-1">Your collection of preferred playing venues</p>
      </div>
      <div className="flex items-center gap-2 bg-lime-500/10 px-4 py-2 rounded-full">
        <Bookmark size={18} className="text-lime-400" />
        <span className="text-lime-300 font-medium">{favoriteTurfs.length} Saved</span>
      </div>
    </div>

    {favoriteTurfs.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-900 rounded-xl border border-gray-700">
        <Bookmark size={48} className="text-gray-600 mb-6" strokeWidth={1.5} />
        <h2 className="text-2xl font-medium text-gray-200 mb-3">No saved turfs yet</h2>
        <p className="text-gray-400 max-w-md mb-8">
          Bookmark turfs you like to find them easily here later
        </p>
        <button 
          onClick={() => navigate('/turfs')}
          className="px-8 py-3 bg-lime-500 text-white rounded-lg font-medium hover:bg-lime-600 transition flex items-center gap-2"
        >
          <MapPin size={18} />
          Explore Turfs
        </button>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favoriteTurfs.map((turf) => (
          <div
            key={turf._id}
            onClick={() => handleNavigate(turf._id)}
            className="group relative bg-gray-900 rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-gray-700 hover:border-lime-500 transition-all cursor-pointer"
          >
            <div className="relative h-48">
              <img
                src={turf.images[0] || '/default-turf.jpg'}
                alt={turf.name}
                className="w-full h-full object-cover group-hover:brightness-95 transition"
              />
              
              <div className="absolute top-3 right-3">
                <button
                  onClick={(e) => removeFromFavorites(turf._id, e)}
                  className="p-2 bg-gray-800/90 rounded-lg hover:bg-red-100 transition shadow-sm"
                  title="Remove from saved"
                >
                  <Bookmark size={18} className="text-lime-400 fill-lime-400" />
                </button>
              </div>
              
              <div className="absolute bottom-3 left-3">
                <div className="flex items-center gap-1 bg-gray-800/90 px-3 py-1 rounded-full shadow-sm">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-medium text-white">
                    {turf.averageRating > 0 ? turf.averageRating.toFixed(1) : 'New'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start gap-2 mb-2">
                <h2 className="text-lg font-bold text-white truncate">{turf.name}</h2>
                {turf.distance && (
                  <div className="flex items-center gap-1 text-sm text-lime-400 whitespace-nowrap">
                    <MapPin size={14} className="text-lime-400" />
                    <span>{turf.distance.toFixed(1)} km</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-gray-400 mb-3">
                <MapPin size={14} className="text-gray-500" />
                <span className="text-sm">
                  {turf.location.address}, {turf.location.city} - {turf.location.pincode}
                </span>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <div className="bg-lime-500/10 text-lime-300 px-3 py-1 rounded-full text-sm font-medium">
                  ₹{turf.priceRange}
                </div>
                <button 
                  className="flex items-center gap-1 text-lime-400 hover:text-lime-300 transition text-sm font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigate(turf._id);
                  }}
                >
                  <span>View slots</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>

  );
};

export default Favorite;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';

const favoriteTurfs = [
  {
    id: 'turf-001',
    name: 'TurboTurf Arena',
    location: 'Kolhapur, MH',
    image: 'https://source.unsplash.com/400x250/?football,field',
    rating: 4.8,
  },
  {
    id: 'turf-002',
    name: 'Prime Playzone',
    location: 'Ichalkaranji, MH',
    image: 'https://source.unsplash.com/400x250/?sports,turf',
    rating: 4.5,
  },
];

const Favorite = () => {
  const navigate = useNavigate();

  const handleNavigate = (id) => {
    navigate(`/overview/${id}`);
  };

  return (
    <div className="p-4 min-h-screen   transition-colors duration-300">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Your Favorite Turfs</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {favoriteTurfs.map((turf) => (
          <div
            key={turf.id}
            onClick={() => handleNavigate(turf.id)}
            className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow dark:shadow-md hover:scale-[1.02] transition cursor-pointer"
          >
            <div className="relative">
              <img
                src={turf.image}
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
              <p className="text-sm text-gray-500 dark:text-gray-400">{turf.location}</p>
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

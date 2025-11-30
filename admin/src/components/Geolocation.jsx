import { useState, useEffect } from 'react';

const useGeolocation = () => {
  const [location, setLocation] = useState();
  const [error, setError] = useState();

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    const geoOptions = {
      timeout: 20000,
      maximumAge: 0,
      enableHighAccuracy: true, // 🔥 more reliable on mobile
    };

    const successHandler = (position) => {
      const { latitude, longitude } = position.coords;
      setLocation({ latitude, longitude });
    };

    const errorHandler = (err) => {
      setError(`Location error: ${err.message}`);
    };

    navigator.geolocation.getCurrentPosition(successHandler, errorHandler, geoOptions);
  }, []);

  return { location, error };
};

export default useGeolocation;

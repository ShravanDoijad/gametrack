import React from 'react'
import { useState, useEffect } from 'react'

const useGeolocation = () => {
    const [location, setlocation] = useState()
    const [error, seterror] = useState()

    useEffect(() => {
        if(!navigator.geolocation){
            seterror("Geolocation is not supported by this browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position)=>{
                const {latitude, longitude} = position.coords;
                setlocation({
                    latitude: latitude,
                    longitude: longitude
                });
            },
            (err)=>{
                seterror(`Error occurred while retrieving location: ${err.message}`);
            },
            { timeout: 5000, maximumAge: 60000, enableHighAccuracy: false }
        )
    },[])
  return {location, error}
}

export default useGeolocation;
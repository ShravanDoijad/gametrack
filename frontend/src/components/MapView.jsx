import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { X, Timer, MapPinHouse } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";

mapboxgl.accessToken = import.meta.env.VITE_MAPTOKEN;

const MapView = ({
  longitude, // turf lon
  latitude,  // turf lat
  userLat,
  userLng,
  zoom = 12,
  setmapView,
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [durationInMin, setDurationInMin] = useState(null);
  const [distanceInKm, setDistanceInKm] = useState(null);

  useEffect(() => {
    if (!userLat || !userLng || !latitude || !longitude) {
      toast.error("Coordinates missing. Cannot load route.");
      return;
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/navigation-day-v1",
      center: [longitude, latitude],
      zoom: zoom,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", async () => {
      const turfCoords = [longitude, latitude];
      const userCoords = [userLng, userLat];

      console.log("userCoords", userCoords)
      console.log("turfCoords", turfCoords)
      // Add both markers
      new mapboxgl.Marker({ color: "green" }).setLngLat(turfCoords).addTo(map);
      new mapboxgl.Marker({ color: "blue" }).setLngLat(userCoords).addTo(map);

      // Mapbox Directions API request
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userCoords[0]},${userCoords[1]};${turfCoords[1]},${turfCoords[0]}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;

      try {
        const resp = await fetch(url);
        const data = await resp.json();

        if (!data.routes?.length) {
          console.warn("❌ No route data");
          toast.error("Unable to calculate route. Check coordinates.");
          return;
        }

        const route = data.routes[0].geometry;

        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: route,
          },
        });

        map.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#ff8800",
            "line-width": 5,
          },
        });

        const bounds = new mapboxgl.LngLatBounds();
        route.coordinates.forEach((coord) => bounds.extend(coord));
        map.fitBounds(bounds, { padding: 60 });

        setDistanceInKm((data.routes[0].distance / 1000).toFixed(2));
        setDurationInMin(Math.ceil(data.routes[0].duration / 60));
      } catch (err) {
        console.error("Error fetching directions:", err);
        toast.error("Failed to fetch route.");
      }
    });

    return () => map.remove();
  }, [longitude, latitude, userLat, userLng, zoom]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="fixed inset-0 z-50 bg-white shadow-xl rounded-t-2xl overflow-hidden"
      >
        <button
          onClick={() => {
            setmapView(false);
          }}
          className="absolute top-4 right-4 z-50 bg-black/80 p-2 rounded-full text-white hover:bg-black"
        >
          <X className="w-5 h-5" />
        </button>

        <div ref={mapContainerRef} className="w-full h-[85vh]" />

        {durationInMin && distanceInKm && (
          <div className="absolute bottom-35 left-6 z-50 backdrop-blur-md bg-white/70 px-4 py-2 rounded-xl shadow-xl border border-gray-200 flex items-center justify-center gap-4 text-gray-800 text-sm font-medium">
            <div className="flex items-center gap-1">
              <Timer color="#010101" />
              <span className="sora font-semibold">{durationInMin} min</span>
            </div>
            <span className="text-gray-400">|</span>
            <div className="flex items-center gap-1">
              <MapPinHouse color="#ff0000" />
              <span className="sora font-semibold">{distanceInKm} km</span>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default MapView;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import TurfCard from "../components/TurfCard";
import SkeletonLoader from "../components/SkeletonLoader";

import footballIcon from "../assets/football.png";
import cricketIcon from "../assets/cricket.png";
import badmintonIcon from "../assets/badminton.png";

const SPORTS = [
  { id: "football", name: "Football", icon: footballIcon, color: "bg-orange-500" },
  { id: "cricket", name: "Cricket", icon: cricketIcon, color: "bg-blue-500" },
  { id: "badminton", name: "Badminton", icon: badmintonIcon, color: "bg-green-500" },
];

export const Turfs = () => {
  const navigate = useNavigate();
  const [turfs, setTurfs] = useState([]);
  const [isLoading, setisLoading] = useState(false);

  const fetchTurfs = async () => {
    try {
      setisLoading(true);
      const ownerId = import.meta.env.VITE_OWNER_ID;
      if (!ownerId) {
        console.error("Owner ID not found in environment variables.");
        toast.error("Configuration error: Owner ID is missing.");
        return;
      }
      const response = await axios.get(`/api/turfs/getOwnerTurfs?ownerId=${ownerId}`);
      console.log(response.data);
      const fetchedTurfs = response.data;
      
      if (fetchedTurfs && fetchedTurfs.length === 1) {
        navigate(`/overview/${fetchedTurfs[0]._id}`, { replace: true });
      } else {
        setTurfs(fetchedTurfs);
      }
    } catch (error) {
      console.error("Error fetching turfs:", error);
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setisLoading(false);
    }
  };

  useEffect(() => {
    fetchTurfs();
  }, []);

  if (isLoading || (turfs && turfs.length === 1)) return <SkeletonLoader />;

  return (
    <div className="w-full px-6 py-4 text-white bg-gradient-to-b from-gray-900 to-gray-950 min-h-screen">
      <h2 className="font-bold text-2xl mb-6 bg-clip-text text-transparent bg-gradient-to-r from-lime-400 to-emerald-500">
        Our Turf
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {turfs.map((turf) => (
          <TurfCard
            key={turf._id}
            sports={SPORTS}
            turf={turf}
            onClick={() =>
              navigate(`/overview/${turf._id}`)
            }
          />
        ))}
      </div>
      
      {!isLoading && turfs.length === 0 && (
        <div className="text-center text-gray-400 mt-10">
          No turf available for booking at the moment.
        </div>
      )}
    </div>
  );
};

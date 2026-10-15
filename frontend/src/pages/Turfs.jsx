import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import SkeletonLoader from "../components/SkeletonLoader";

// Single-turf mode: there is no turf list anymore.
// "/" immediately sends the user to the one turf's page, where "Book Now" lives.
//
// The backend (TURF_ID in backend/.env) decides which turf this is, so
// /api/turfs/getAllTurfs only ever returns that one turf.
export const Turfs = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const goToTurf = async () => {
      try {
        const response = await axios.get("/api/turfs/getAllTurfs");
        const turfs = response.data;

        if (!turfs || turfs.length === 0) {
          toast.error("No turf available for booking at the moment.");
          return;
        }
        navigate(`/overview/${turfs[0]._id}`, { replace: true });
      } catch (error) {
        console.error("Error fetching turf:", error);
        toast.error(error.response?.data?.message || "Something went wrong");
      }
    };

    goToTurf();
  }, [navigate]);

  return <SkeletonLoader />;
};
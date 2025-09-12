import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  Clock3,
  Gamepad2,
  ChevronRight,
  Star,
  ChevronLeft,
} from "lucide-react";

import footballIcon from "../assets/football.png";
import cricketIcon from "../assets/cricket.png";
import badmintonIcon from "../assets/badminton.png";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import Geolocation from "../components/Geolocation";
import axios from "axios";
import { toast } from "react-toastify";
import TurfCard from "../components/TurfCard";
import TimeSlotPicker from "../components/TimeSlotPicker";
import { BookContext } from "../constexts/bookContext";
import SkeletonLoader from "../components/SkeletonLoader";
import moment from "moment";
const SPORTS = [
  {
    id: "football",
    name: "Football",
    icon: footballIcon,
    color: "bg-orange-500",
  },
  { id: "cricket", name: "Cricket", icon: cricketIcon, color: "bg-blue-500" },
  {
    id: "badminton",
    name: "Badminton",
    icon: badmintonIcon,
    color: "bg-green-500",
  },
];

const CITIES = [
  { id: "ichalkaranji", name: "Ichalkaranji" },
  // { id: "kolhapur", name: "Kolhapur" },
  // { id: "sangli", name: "Sangli" },
];




const generateTimeSlots = (openHour = 6, openMinute = 0, closeMinute = 0, closeHour = 24) => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes()

  const slots = [];
  let currentMinutes = openHour * 60 + openMinute;
  const closingMinutes = closeHour * 60 + closeMinute;
  while (currentMinutes <= closingMinutes) {
    const hour = Math.floor(currentMinutes / 60);
    const minute = currentMinutes % 60;


    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const timeString = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;


    const militaryTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    slots.push({
      display: timeString,
      military: militaryTime,
      hour: hour,
      minute: minute
    });

    currentMinutes += 30;
  }


  const filteredSlots = slots.filter(slot => {
    return slot.hour > currentHour ||
      (slot.hour === currentHour && slot.minute > currentMinute);
  });
  console.log("filteredSlots", filteredSlots)
  return filteredSlots;
};

export const Turfs = () => {
  const navigate = useNavigate();
  const [nearestSwitch, setNearestSwitch] = useState(false);
  const [turfs, setTurfs] = useState([]);

  const [checkInSlot, setCheckInSlot] = useState(null);
  const [checkOutSlot, setCheckOutSlot] = useState(null);
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [currentPickerMode, setCurrentPickerMode] = useState("check-in");
  const [availableHours, setAvailableHours] = useState([1, 2, 3, 4]);
  const { location, error } = Geolocation();
  const { selectedSport, setSelectedSport, calculateDistance } = useContext(BookContext)
  const [isLoading, setisLoading] = useState(false)
  const fetchTurfs = async () => {
    try {
      setisLoading(true)
      const response = await axios.get("/api/turfs/getAllTurfs");
      setTurfs(response.data);
    } catch (error) {
      console.error("Error fetching turfs:", error);
      toast.error(error.response?.data?.message || "Something went wrong");
    }
    finally {
      setisLoading(false)
    }
  };

  useEffect(() => {
    fetchTurfs();
  }, []);

  const timeSlots = generateTimeSlots();

  const filteredTurfs = useMemo(() => {
    let allSlots = [];
    let results = [...turfs];

   results = results.filter((turf) => 
  turf.name !== "admin Turf" && 
  turf.name !== "admin #3" &&
  turf.name.toLowerCase() !== "dream sports club"
);



    if (selectedSport && results.length > 0) {
      results = results.filter((turf) =>
        turf.sportsAvailable?.some(sport =>
          sport.toLowerCase() === selectedSport.toLowerCase()
        ));
    }

    if (location) {
      results = results.map((turf) => ({
        ...turf,
        distance: calculateDistance(
          location.latitude,
          location.longitude,
          turf.location.coordinates[0],
          turf.location.coordinates[1]
        ),
      }));
    }

    if (nearestSwitch) {
      results = results
        .filter((turf) => turf.distance < 5)
        .sort((a, b) => a.distance - b.distance);
    }

    let timeToMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const [time, period] = timeStr.split(" ");
      const [hours, minutes] = time.split(":").map(Number);
      let totalHours = hours;
      if (period === "PM" && hours < 12) totalHours += 12;
      if (period === "AM" && hours === 12) totalHours = 0;

      return totalHours * 60 + (minutes || 0);
    };

    const isSlotAvailable = (checkInSlot, checkOutSlot, bookedSlots) => {
          const checkInTime = moment(checkInSlot, "h:mm");
          const checkOutTime = moment(checkOutSlot, "h:mm");
          // console.log("checkInTime", checkInTime, "checkOutTime", checkOutTime, "todayBookings", bookedSlots)
          for (const slot of bookedSlots) {
            const slotStart = moment(slot.start, "h:mm");
            const slotEnd = moment(slot.end, "h:mm");
            if (
              (checkInTime.isBetween(slotStart, slotEnd, null, "[]") ||
                checkOutTime.isBetween(slotStart, slotEnd, null, "[]")) ||
              (checkInTime.isSameOrBefore(slotStart) &&
                checkOutTime.isSameOrAfter(slotEnd))
            ) {
              return false; 
            }
          }   return true; 
        };
    results = results.filter((turf) => {
      const today = new Date().toISOString().split("T")[0];
      const todayBookings = turf.bookedSlots.filter(
        (slot) => slot.date === today
      );
      const bookedSlots= todayBookings.flatMap(slot => slot.slots);
  
      const openingHour = Number(turf.openingTime.split(":")[0]);
      const closingHour = Number(turf.closingTime.split(":")[0]);
     

     return isSlotAvailable(checkInSlot, checkOutSlot, bookedSlots)

    });


    return results;
  }, [
    turfs,
    selectedSport,
    nearestSwitch,
    location,
    checkInSlot,
    checkOutSlot,
  ]);



  useEffect(() => {
    if (checkInSlot) {
      const checkInHour = parseInt(checkInSlot.split(":")[0]);
      const checkInPeriod = checkInSlot.includes("AM") ? "AM" : "PM";

      const newAvailableHours = [1, 2, 3, 4].map((hours) => {
        let newHour = checkInHour + hours;
        let newPeriod = checkInPeriod;

        if (newHour >= 12 && checkInPeriod === "AM") {
          newPeriod = "PM";
          if (newHour > 12) newHour -= 12;
        }

        return `${newHour}:00 ${newPeriod}`;
      });

      setAvailableHours(newAvailableHours);
      setCheckOutSlot(null);
    }
  }, [checkInSlot]);

  const handleSlotSelection = (slot) => {
    if (currentPickerMode === "check-in") {
      setCheckInSlot(slot);
      setCurrentPickerMode("check-out");
    } else {
      setCheckOutSlot(slot);
      setShowSlotPicker(false);
    }
  };


  const handleSportFilter = (id) => {
    setSelectedSport(selectedSport === id ? "" : id);
  };


  {
    !location && error && (
      <div className="text-red-400 text-sm">
        {error} <br /> Try enabling location manually or refresh the page.
      </div>
    )
  }


  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="w-full  px-6 py-4 text-white bg-gradient-to-b from-gray-900 to-gray-950">

      <div className="flex  sm:flex-row items-center justify-between mb-6 gap-4">
        <button
          onClick={() => setNearestSwitch(!nearestSwitch)}
          className={`flex items-center ${nearestSwitch ? "bg-black" : "bg-gray-800/50"
            } gap-3 border border-lime-500/30 px-4 py-2 rounded-lg`}
        >
          <MapPin size={18} className="text-lime-400" />
          <span className="text-lime-400 font-medium">Near Me</span>
        </button>
        <div className="text-gray-400 font-medium">|</div>
        <div className="relative">
          <select className="bg-gray-800/50 border border-gray-700 text-white px-4 py-2 rounded-lg appearance-none pr-8">
            {CITIES.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <ChevronRight size={16} className="rotate-90 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
          <h3 className="text-sm text-gray-400 mb-2">Select Sport</h3>
          <div className="flex justify-between gap-2">
            {SPORTS.map((sport) => (
              <button
                key={sport.id}
                onClick={() => handleSportFilter(sport.id)}
                className={`flex flex-col items-center p-2 rounded-lg transition-all ${selectedSport === sport.id
                  ? `${sport.color} border border-white/20 shadow-lg transform scale-105`
                  : "bg-gray-700/30 hover:bg-gray-700/50"
                  }`}
              >
                <div
                  className={`p-2 rounded-full ${selectedSport === sport.id
                    ? "bg-white/20"
                    : "bg-gray-600/30"
                    }`}
                >
                  <img
                    src={sport.icon}
                    alt={sport.name}
                    className="w-8 h-8 object-contain filter drop-shadow-lg"
                  />
                </div>
                <span
                  className={`text-xs mt-1 ${selectedSport === sport.id
                    ? "font-bold text-white"
                    : "text-gray-300"
                    }`}
                >
                  {sport.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
          <h3 className="text-sm text-gray-400 mb-2">Select Time Slot</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setCurrentPickerMode("check-in");
                setShowSlotPicker(true);
              }}
              className={`flex justify-between items-center p-3 rounded-lg transition-all ${checkInSlot
                ? "bg-lime-500/20 border border-lime-500/50"
                : "bg-gray-700/30 hover:bg-gray-700/50"
                }`}
            >
              <span>{checkInSlot || "Check-in"}</span>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
            <button
              onClick={() => {
                if (checkInSlot) {
                  setCurrentPickerMode("check-out");
                  setShowSlotPicker(true);
                }
              }}
              className={`flex justify-between items-center p-3 rounded-lg transition-all ${checkOutSlot
                ? "bg-lime-500/20 border border-lime-500/50"
                : "bg-gray-700/30 hover:bg-gray-700/50"
                } ${!checkInSlot ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={!checkInSlot}
            >
              <span>{checkOutSlot || "Check-out"}</span>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {showSlotPicker && (
        <TimeSlotPicker
          mode={currentPickerMode}
          slots={currentPickerMode === "check-in" ? timeSlots : availableHours}
          selectedSlot={
            currentPickerMode === "check-in" ? checkInSlot : checkOutSlot
          }
          onSelect={handleSlotSelection}
          onBack={() => setCurrentPickerMode("check-in")}
          onClose={() => setShowSlotPicker(false)}
        />
      )}

      <h2 className="font-bold text-2xl mb-6 bg-clip-text text-transparent bg-gradient-to-r from-lime-400 to-emerald-500">
        Available Turfs
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTurfs.map((turf) => {

          return (
            <TurfCard
              key={turf._id}
              sports={SPORTS}
              bookedSlots={turf.bookedSlots}
              turf={turf}
              selectedSport={selectedSport}
              nearestSwitch={nearestSwitch}
              checkInSlot={checkInSlot}
              checkOutSlot={checkOutSlot}
              onClick={() => {
                navigate(`/overview/${turf._id}`, setNearestSwitch(true), {
                  state: {
                    bookedSlots: turf.bookedSlots,
                    selectedSport,
                    turfDistance: turf.distance

                  },

                })
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

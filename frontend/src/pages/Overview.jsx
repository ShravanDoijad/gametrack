import React, { useState, useRef } from "react";
import {
  Heart,
  Star,
  MapPin,
  Bookmark,
  CalendarClock,
  Dumbbell,
  ShowerHead,
  ShieldCheck,
  Navigation,
  ChevronRight,
  Sun,
  Moon
} from "lucide-react";
import { useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { BookContext } from "../constexts/bookContext";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/effect-fade";
import { Autoplay, EffectFade } from "swiper/modules";
import { useNavigate } from "react-router-dom";
import footballIcon from "../assets/football.png";
import cricketIcon from "../assets/cricket.png";
import badmintonIcon from "../assets/badminton.png";

import userAvatar from "../assets/user.png";
import football from "../assets/football.png";
import cricket from "../assets/cricket.png";
import badminton from "../assets/badminton.png";
import MapView from "../components/MapView";
import useGeolocation from '../components/Geolocation';
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import SkeletonLoader from "../components/SkeletonLoader"
import axios from 'axios'



const SPORTS = [
  {
    id: "football",
    name: "Football",
    icon: footballIcon,
    color: "bg-orange-500",
  },
  { id: "cricket", name: "cricket", icon: cricketIcon, color: "bg-blue-500" },
  {
    id: "badminton",
    name: "Badminton",
    icon: badmintonIcon,
    color: "bg-green-500",
  },
];

const reviews = [
  {
    name: "John Doe",
    text: "Amazing turf! Great facilities and well-maintained.",
    rating: 5,
    timeAgo: "4 days ago",
  },
  {
    name: "Jane Smith",
    text: "Loved the experience! Highly recommend for football lovers.",
    rating: 5,
    timeAgo: "2 days ago",
  },
  {
    name: "Mike Johnson",
    text: "Best turf in the area! Friendly staff and great atmosphere.",
    rating: 4,
    timeAgo: "6 days ago",
  },
];

export const Overview = () => {

  const [turfInfo, setturfInfo] = useState("")
  const [mapView, setmapView] = useState(false);
  const [showSlots, setShowSlots] = useState(false);

  const location = useLocation();
  const { location: userCoords, error: locationError } = useGeolocation();
  const [availableSlots, setAvailableSlots] = useState(
    location.state?.availableSlots || [] // Provide fallback empty array
  );
  const today = new Date().toISOString().split("T")[0]

  const [bookSlots, setbookSlots] = useState(
    []
  );


  const [likes, setLikes] = useState(143);
  const [liked, setLiked] = useState(false);
  const [loading, setloading] = useState(false)
  const [turfDistance, setTurfDistance] = useState(null);
  const { turfId } = useParams()
  const { setfavorite, favorite, selectedSport, setloginPanel, userInfo, setSelectedSport, calculateDistance, token } = useContext(BookContext);

  const lastTapRef = useRef(0);
  const navigate = useNavigate();

  const handleLike = () => {
    if (!liked) {
      setLiked(true);
      setLikes((prev) => prev + 1);
    }
  };
  useEffect(() => {
    if (turfInfo?.bookedSlots) {
      setbookSlots(turfInfo.bookedSlots?.find(slot => slot.date === today)?.slots.map(slot => slot.start) || []);
    }
  }, [turfInfo, today]);


  useEffect(() => {
    if (locationError) {
      toast.error(locationError);
    }
  }, [locationError]);

  useEffect(() => {
    if (
      turfInfo?.location?.coordinates &&
      userCoords?.latitude &&
      userCoords?.longitude
    ) {
      const [turfLng, turfLat] = turfInfo.location.coordinates;
      const dist = calculateDistance(
        userCoords.latitude,
        userCoords.longitude,
        turfLng,
        turfLat
      );
      setTurfDistance(dist);
    }
  }, [turfInfo, userCoords]);


  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      handleLike();
    }
    lastTapRef.current = now;
  };

  const toggleFavorite = (id) => {
    setfavorite(id);
  };



  const getSingleTurf = async () => {

    try {
      setloading(true)
      const res = await axios.get("/api/turfs/getSingleTurf", {
        params: { id: turfId }
      });

      setturfInfo(res.data.turf)

    } catch (error) {
      toast.error(res.data.message || "Internal server Error")
    }
    finally {
      setloading(false)


    }
  }

  useEffect(() => {

    getSingleTurf()

  }, [turfId])

  useEffect(() => {
    if (turfInfo) {
      localStorage.setItem("selectedTurf", turfInfo._id);
    }
  }, [turfInfo]);


  const handleFavorite = async () => {
    if (!token) {
      toast.warn("Login to add Favorite");
      return setloginPanel(true);
    }

    try {
      const response = await axios.post("/api/users/addFavorite", {
        userId: userInfo._id,
        turfId: turfInfo._id,
      });

      toast.success(response.data.message);
      setfavorite(true);
    } catch (error) {
      if (error.response?.status === 409) {
        toast.info("Already added to favorites.");
      } else {
        console.log(error);
        toast.error(error.response?.data?.message || "Something went wrong");
      }
    }
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  if (!turfInfo) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full mt-30 flex items-center justify-center text-white"
      >
        Turf not found
      </motion.div>
    );
  }

  const sports = SPORTS.filter((sport) =>
    turfInfo.sportsAvailable.some((available) =>
      available.toLowerCase() === sport.name.toLowerCase()
    )
  );

  console.log("turfINfo", turfInfo)


  return (
    <div className="w-full pb-10  text-white relative animate-fadeIn">
      {mapView && <MapView longitude={turfInfo.location.coordinates[0]}
        latitude={turfInfo.location.coordinates[1]}
        userLat={userCoords.latitude}
        userLng={userCoords.longitude}
        setmapView={setmapView} />}

      <div className="px-6 pt-6  bg-gradient-to-b from-gray-900 to-transparent sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-start justify-between w-full">
          <div>
            <h2 className="font-bold text-3xl bg-clip-text text-transparent bg-gradient-to-r from-lime-400 to-emerald-500">
              {turfInfo.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1 text-yellow-400 text-sm">
                <Star size={14} fill="yellow" /> {turfInfo.avarageRating}
              </div>
              <span className="text-gray-400">•</span>
              <p className="text-sm flex items-center gap-1 text-gray-300">
                <MapPin size={14} /> {turfInfo.location.city}
              </p>
              <span className="text-gray-400">•</span>

              {turfDistance !== null && (
                <p className="text-lime-400 text-sm font-medium">
                  {turfDistance.toFixed(2)} km
                </p>
              )}

            </div>
          </div>
          <button
            onClick={toggleFavorite && handleFavorite}
            className="p-2 bg-gray-800/80 rounded-full hover:bg-gray-700 transition-colors"
          >
            <Bookmark
              size={20}
              className={`transition-colors duration-300 ${favorite ? "text-yellow-400 fill-yellow-400" : "text-white"
                }`}
            />
          </button>
        </div>
      </div>


      <div className="px-6 ">

        <div
          onClick={handleDoubleTap}
          onDoubleClick={handleLike}
          className="relative w-full h-72 rounded-2xl overflow-hidden shadow-2xl group cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
          <img
            src={turfInfo.images[0]}
            alt="Turf"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
            <div className="flex justify-between items-end">
              <div>
                <div className="flex items-center gap-2 text-white/90 mb-1">
                  <MapPin size={16} className="text-lime-400" />
                  <span>{turfInfo.location.address}, {turfInfo.location.pincode}</span>
                </div>
                <button
                  onClick={() => setmapView(true)}
                  className="flex items-center gap-1 text-lime-400 hover:text-lime-300 transition-colors"
                >
                  <Navigation size={16} /> View on Map
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1">
                  <Heart
                    size={18}
                    className={liked ? "fill-pink-500 text-pink-500" : "text-gray-300"}
                  />
                  <span className="text-sm font-medium">{turfInfo.likes}</span>
                </div>
              </div>
            </div>
          </div>
        </div>


        <div className="mt-6 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-5 shadow-lg overflow-hidden">

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Turf Booking Rates</h3>
            <button
              onClick={() => navigate("/booking",
                {
                  state: turfInfo._id



                }
              )}
              className="bg-lime-500 hover:bg-lime-400 text-gray-900 font-semibold px-5 py-2 rounded-lg transition-colors flex items-center gap-1"
            >
              Book Now <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            {turfInfo.dayPrice === turfInfo.nightPrice ? (
              <div className="flex-1 bg-gradient-to-br from-blue-900 to-blue-800 border border-blue-700 rounded-lg p-4 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-24 h-24 bg-blue-600 rounded-full opacity-20"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <Sun size={18} className="text-amber-300" />
                    <Moon size={18} className="text-indigo-300" />
                    <span className="text-blue-200 font-medium">Standard Rate</span>
                    <span className="text-xs text-blue-300 ml-auto">All Day</span>
                  </div>
                  <p className="font-bold text-3xl text-white">₹{turfInfo.dayPrice}<span className="text-blue-300 text-lg">/hour</span></p>
                  <p className="text-blue-200 text-sm mt-1">Same rate for day and night</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 bg-gradient-to-br from-blue-900 to-blue-800 border border-blue-700 rounded-lg p-4 relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 w-24 h-24 bg-blue-600 rounded-full opacity-20"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                      <Sun size={18} className="text-amber-300" />
                      <span className="text-blue-200 font-medium">Day Rate</span>
                      <span className="text-xs text-blue-300 ml-auto">7AM - 6PM</span>
                    </div>
                    <p className="font-bold text-3xl text-white">₹{turfInfo.dayPrice}<span className="text-blue-300 text-lg">/hour</span></p>
                    <p className="text-blue-200 text-sm mt-1">Perfect for morning matches and practice</p>
                  </div>
                </div>

                <div className="flex-1 bg-gradient-to-br from-indigo-900 to-purple-800 border border-purple-700 rounded-lg p-4 relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 w-24 h-24 bg-purple-600 rounded-full opacity-20"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                      <Moon size={18} className="text-indigo-300" />
                      <span className="text-purple-200 font-medium">Night Rate</span>
                      <span className="text-xs text-purple-300 ml-auto">6PM - 11PM</span>
                    </div>
                    <p className="font-bold text-3xl text-white">₹{turfInfo.nightPrice}<span className="text-purple-300 text-lg">/hour</span></p>
                    <p className="text-purple-200 text-sm mt-1">Floodlit turf for cooler evening games</p>
                  </div>
                </div>
              </>
            )}
          </div>


          <p className="text-gray-400 text-xs mt-4 text-center">
            * Rates include standard equipment. Premium sports may have additional charges.
          </p>
        </div>
        {
          turfInfo.subscription && turfInfo.subscription.length > 0 ? (
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-lime-500 w-1.5 h-1.5 rounded-full"></span>
                Subscription Plans
              </h3>
              <div className="space-y-3">
                {turfInfo.subscription.map((plan, index) => (
                  <div
                    key={plan._id}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4 shadow-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lime-400 font-bold">
                          {plan.days === 15 ? '15 Days Plan' :
                            plan.days === 30 ? 'Monthly Plan' :
                              plan.days === 45 ? '45 Days Plan' :
                                `${plan.days} Days Plan`}
                        </h4>
                        <p className="text-gray-300 text-sm">{plan.description || 'Premium subscription plan'}</p>
                      </div>
                      <span className="bg-lime-500/10 text-lime-400 px-3 py-1 rounded-full text-sm font-medium">
                        ₹{plan.amount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null
        }
        {/* Sports Section */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="bg-lime-500 w-1.5 h-1.5 rounded-full"></span>
            Sports Available
          </h3>
          <div className="flex justify-between gap-2">
            {sports.map((sport) => (
              <button
                key={sport.id}
                onClick={() => { selectedSport == sport.id ? setSelectedSport("") : setSelectedSport(sport.id) }}
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

        {/* Facilities Section */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="bg-lime-500 w-1.5 h-1.5 rounded-full"></span>
            Facilities
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {
              turfInfo.amenities.map((amenity, idx) =>
                <div key={idx} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 flex items-center gap-3">
                  <div className="bg-lime-500/10 p-2 rounded-lg">
                    <Dumbbell size={18} className="text-lime-400" />
                  </div>
                  <span className="text-sm">{amenity}</span>
                </div>
              )}
          </div>
        </div>

        {
          !turfInfo.subscription == "free" ?
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-lime-500 w-1.5 h-1.5 rounded-full"></span>
                Subscription Plans
              </h3>
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4 shadow-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lime-400 font-bold">Weekly Pass</h4>
                      <p className="text-gray-300 text-sm">Play anytime 7 days a week</p>
                    </div>
                    <span className="bg-lime-500/10 text-lime-400 px-3 py-1 rounded-full text-sm font-medium">₹499/week</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4 shadow-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-yellow-400 font-bold">Monthly Pro</h4>
                      <p className="text-gray-300 text-sm">Unlimited bookings + 1 guest free</p>
                    </div>
                    <span className="bg-yellow-500/10 text-yellow-400 px-3 py-1 rounded-full text-sm font-medium">₹1799/month</span>
                  </div>
                </div>
              </div>
            </div> : ""
        }
        {/* Reviews Section */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="bg-lime-500 w-1.5 h-1.5 rounded-full"></span>
            Customer Reviews
          </h3>
          <Swiper
            spaceBetween={15}
            slidesPerView={1}
            loop={true}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            effect="fade"
            fadeEffect={{ crossFade: true }}
            modules={[Autoplay, EffectFade]}
            className="rounded-xl overflow-hidden"
          >
            {reviews.map((review, index) => (
              <SwiperSlide key={index}>
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={userAvatar}
                      alt="User Avatar"
                      className="w-10 h-10 rounded-full border-2 border-lime-500/50"
                    />
                    <div>
                      <div className="font-semibold">{review.name}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-500"}
                            />
                          ))}
                        </div>
                        <span className="text-gray-400 text-sm">{review.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">"{review.text}"</p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="bg-lime-500 w-1.5 h-1.5 rounded-full"></span>
            Terms & Conditions
          </h3>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <ul className="space-y-2 text-sm text-gray-300">
              {turfInfo.onSitePolicies.map((policy, idx) =>
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-lime-400">•</span>{policy}
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>




      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent backdrop-blur-sm p-4 z-20">
        <div className="flex justify-between items-center max-w-md mx-auto w-full">
          <button
            onClick={() => setShowSlots(true)}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-5 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <CalendarClock size={18} /> View Slots
          </button>
          <button
            onClick={() => navigate("/booking",
              {
                state: turfInfo
              }
            )}
            className="bg-lime-500 hover:bg-lime-400 text-gray-900 font-semibold px-6 py-3 rounded-xl shadow-lg transition-colors flex items-center gap-2"
          >
            Book Now <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Slots Modal */}
      {showSlots && (
        <>
          <div
            className="fixed inset-0  bg-black/80 z-40 backdrop-blur-sm"
            onClick={() => setShowSlots(false)}
          ></div>
          <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 rounded-t-2xl p-6 animate-slideUp max-h-[70vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Available Slots</h3>
              <button
                onClick={() => setShowSlots(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {availableSlots.map((slot, idx) => (

                <div
                  key={idx}
                  className={`p-4 rounded-xl border text-sm transition-all flex justify-between items-center

                         "bg-lime-500/10 border-lime-500/50 text-lime-400 hover:bg-lime-500/20 cursor-pointer"
                    }`}
                >
                  <span>{slot}</span>
                  <span className="font-medium">
                    {"Available"}
                  </span>
                </div>

              ))}
              {
                bookSlots.map((slot, idx) => (

                  <div
                    key={idx}
                    className={`p-4 rounded-xl border text-sm transition-all flex justify-between items-center

                         "bg-gray-800/50 border-gray-700 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <span>{slot}</span>
                    <span className="font-medium">
                      {"Booked"}
                    </span>
                  </div>

                ))
              }
            </div>
          </div>
        </>
      )}
    </div>
  );
};


import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { MapPin, Clock, Star, Navigation, ChevronRight, Check } from "lucide-react";
import SkeletonLoader from "../components/SkeletonLoader";

// Turns "18:00" into "6 PM" and "06:30" into "6:30 AM". Leaves anything else untouched.
const to12h = (time) => {
  if (!time || !/^\d{1,2}:\d{2}/.test(time)) return time || "";
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour} ${suffix}` : `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
};

const Section = ({ title, children }) => (
  <section className="mt-8">
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    {children}
  </section>
);

export const Overview = () => {
  const { turfId } = useParams();
  const navigate = useNavigate();
  const [turf, setTurf] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/turfs/getSingleTurf", { params: { id: turfId } });
        setTurf(res.data.turf);
        console.log(res.data.turf)
        if (res.data.turf?._id) localStorage.setItem("selectedTurf", res.data.turf._id);
      } catch (error) {
        toast.error(error.response?.data?.message || "Could not load the turf. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    const loadReviews = async () => {
      try {
        const res = await axios.get("/api/turfs/get-reviews", { params: { turfId } });
        setReviews(res.data.reviews || []);
      } catch (error) {
        console.log(error);
      }
    };

    load();
    loadReviews();
  }, [turfId]);

  if (loading) return <SkeletonLoader />;

  if (!turf) {
    return (
      <div className="w-full mt-24 text-center text-white px-6">
        <p className="text-xl font-semibold">Turf not found</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-3 rounded-xl bg-lime-400 text-gray-950 font-bold"
        >
          Try again
        </button>
      </div>
    );
  }

  const goBook = (plan) => navigate("/booking", { state: { turfId: turf._id, plan } });

  const [lat, lng] = turf.location?.coordinates || [];
  const directionsUrl =
    lat && lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${turf.name} ${turf.location?.address || ""} ${turf.location?.city || ""}`
        )}`;

  const samePrice = turf.dayPrice === turf.nightPrice || !turf.nightPrice;
  const address = [turf.location?.address, turf.location?.city, turf.location?.pincode]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="w-full text-white pb-44">
      {/* Photos: swipe sideways, no library needed */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-2 px-4 pt-4 [scrollbar-width:none]">
        {turf.images?.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${turf.name} photo ${i + 1}`}
            className="snap-center shrink-0 w-full max-w-2xl h-64 sm:h-80 object-cover rounded-3xl"
          />
        ))}
      </div>

      <div className="px-5 max-w-2xl mx-auto">
        {/* Name + rating */}
        <h1 className="mt-5 text-3xl font-extrabold text-lime-400">{turf.name}</h1>
        {turf.averageRating > 0 && (
          <p className="mt-1 flex items-center gap-1 text-lg text-yellow-400">
            <Star size={18} fill="currentColor" /> {Number(turf.averageRating).toFixed(1)}
            <span className="text-gray-400 text-base ml-1">({reviews.length} reviews)</span>
          </p>
        )}

        {/* Price: the most important thing, in plain words */}
        <div className="mt-5 rounded-2xl bg-white/5 border border-white/10 p-5">
          {samePrice ? (
            <p className="text-4xl font-extrabold">
              ₹{turf.dayPrice}
              <span className="text-lg font-medium text-gray-300"> per hour</span>
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-lg text-gray-200">
                  Day
                  <span className="text-sm text-gray-400">
                    {" "}({to12h(turf.openingTime)} – {to12h(turf.nightPriceStart)})
                  </span>
                </span>
                <span className="text-2xl font-extrabold">₹{turf.dayPrice}<span className="text-base font-medium text-gray-300"> /hour</span></span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg text-gray-200">
                  Night
                  <span className="text-sm text-gray-400">
                    {" "}({to12h(turf.nightPriceStart)} – {to12h(turf.closingTime)})
                  </span>
                </span>
                <span className="text-2xl font-extrabold">₹{turf.nightPrice}<span className="text-base font-medium text-gray-300"> /hour</span></span>
              </div>
            </div>
          )}
        </div>

        {/* Timings + address + directions */}
        <div className="mt-4 space-y-3 text-lg text-gray-200">
          {turf.openingTime && turf.closingTime && (
            <p className="flex items-start gap-3">
              <Clock className="mt-1 shrink-0 text-lime-400" size={22} />
              Open every day, {to12h(turf.openingTime)} to {to12h(turf.closingTime)}
            </p>
          )}
          {address && (
            <p className="flex items-start gap-3">
              <MapPin className="mt-1 shrink-0 text-lime-400" size={22} />
              {address}
            </p>
          )}
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex items-center justify-center gap-2 w-full py-4 rounded-2xl border-2 border-lime-400 text-lime-400 text-lg font-bold active:scale-95 transition"
        >
          <Navigation size={22} /> Get Directions
        </a>

        {/* Sports */}
        {turf.sportsAvailable?.length > 0 && (
          <Section title="Games you can play">
            <div className="flex flex-wrap gap-2">
              {turf.sportsAvailable.map((sport) => (
                <span
                  key={sport}
                  className="px-4 py-2 rounded-full bg-white/10 text-lg capitalize"
                >
                  {sport}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Facilities */}
        {turf.amenities?.length > 0 && (
          <Section title="Facilities">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {turf.amenities.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-lg text-gray-200">
                  <Check size={20} className="text-lime-400 shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Monthly plans (only if the owner has added some) */}
        {turf.subscription?.length > 0 && (
          <Section title="Monthly plans">
            <div className="space-y-3">
              {turf.subscription.map((plan) => (
                <button
                  key={plan._id}
                  onClick={() => goBook(plan)}
                  className="w-full text-left rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center justify-between active:scale-95 transition"
                >
                  <span>
                    <span className="block text-lg font-bold text-lime-400">{plan.days} days</span>
                    {plan.description && (
                      <span className="block text-gray-300">{plan.description}</span>
                    )}
                  </span>
                  <span className="text-xl font-extrabold">₹{plan.amount}</span>
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* Rules */}
        {turf.onSitePolicies?.length > 0 && (
          <Section title="Rules">
            <ul className="space-y-2 text-lg text-gray-300">
              {turf.onSitePolicies.map((rule, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-lime-400">•</span> {rule}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Reviews: just the latest 3, no slider */}
        {reviews.length > 0 && (
          <Section title="What players say">
            <div className="space-y-3">
              {[...reviews]
                .reverse()
                .slice(0, 3)
                .map((r, i) => (
                  <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <p className="font-semibold text-lg">
                      {r.name || "Player"}{" "}
                      <span className="text-yellow-400 text-base">
                        {"★".repeat(r.rating || 0)}
                      </span>
                    </p>
                    {r.comment && <p className="text-gray-300 mt-1">{r.comment}</p>}
                  </div>
                ))}
            </div>
          </Section>
        )}
      </div>

      {/* One big button, always visible, sitting above the bottom menu */}
      <div className="fixed left-0 right-0 bottom-24 z-40 px-5 pointer-events-none">
        <button
          onClick={() => goBook()}
          className="pointer-events-auto mx-auto flex items-center justify-center gap-2 w-full max-w-2xl py-4 rounded-2xl bg-lime-400 text-gray-950 text-xl font-extrabold shadow-[0_10px_30px_rgba(163,230,53,0.35)] active:scale-95 transition"
        >
          Book Now <ChevronRight size={24} className="stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
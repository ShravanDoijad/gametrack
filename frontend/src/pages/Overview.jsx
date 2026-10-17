/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { MapPin, Clock, Star, Navigation, ChevronLeft, ChevronRight, Check } from "lucide-react";
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
  const reviewTrackRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setLoadError("");
        const res = await axios.get("/api/turfs/getSingleTurf", { params: { id: turfId } });
        setTurf(res.data.turf);
        if (!res.data.turf) setLoadError("This turf could not be found.");
      } catch (error) {
        setLoadError(error.response?.status === 404 ? "This turf could not be found." : "Could not load the turf. Check your connection and try again.");
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
  }, [turfId, retryCount]);

  if (loading) return <SkeletonLoader />;

  if (!turf) {
    return (
      <div className="w-full mt-24 text-center text-white px-6">
        <p className="text-xl font-semibold">{loadError || "This turf could not be found."}</p>
        <button
          onClick={() => setRetryCount((count) => count + 1)}
          className="mt-4 px-6 py-3 rounded-xl bg-lime-400 text-gray-950 font-bold"
        >
          Try again
        </button>
      </div>
    );
  }

  const goBook = (plan) => navigate(`/booking/${turf._id}${plan?._id ? `?planId=${encodeURIComponent(plan._id)}` : ""}`);

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
    <div className="w-full overflow-x-clip pb-32 text-white sm:pb-36 lg:pb-16">
      {/* Photos: swipe sideways, no library needed */}
      <div data-tour="turf-card" data-tour-route={`/booking/${turf._id}`} className="mx-auto flex w-full snap-x snap-mandatory gap-3 overflow-x-auto px-4 pt-4 [scrollbar-width:none] sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-3 lg:grid-flow-row lg:overflow-visible lg:px-8">
        {turf.images?.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${turf.name} photo ${i + 1}`}
            className={`h-56 w-full shrink-0 snap-center rounded-2xl object-cover sm:h-80 lg:h-[248px] ${i === 0 && turf.images.length > 1 ? "lg:col-span-2 lg:row-span-2 lg:h-[508px]" : ""} ${turf.images.length === 1 ? "lg:col-span-3 lg:h-[508px]" : ""}`}
          />
        ))}
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:px-8">
      <div className="min-w-0">
        {/* Name + rating */}
        <h1 className="mt-5 break-words text-3xl font-extrabold text-lime-400 sm:text-4xl">{turf.name}</h1>
        {turf.averageRating > 0 && (
          <p className="mt-1 flex items-center gap-1 text-lg text-yellow-400">
            <Star size={18} fill="currentColor" /> {Number(turf.averageRating).toFixed(1)}
            <span className="text-gray-400 text-base ml-1">({reviews.length} reviews)</span>
          </p>
        )}

        {/* Price: the most important thing, in plain words */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 lg:hidden">
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

        {/* Compact review carousel */}
        {reviews.length > 0 && (
          <Section title="What players say">
            <div className="relative">
              {reviews.length > 1 && <div className="mb-2 flex justify-end gap-2">
                <button type="button" aria-label="Previous review" onClick={() => reviewTrackRef.current?.scrollBy({ left: -reviewTrackRef.current.clientWidth, behavior: "smooth" })} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"><ChevronLeft size={17} /></button>
                <button type="button" aria-label="Next review" onClick={() => reviewTrackRef.current?.scrollBy({ left: reviewTrackRef.current.clientWidth, behavior: "smooth" })} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"><ChevronRight size={17} /></button>
              </div>}
              <div ref={reviewTrackRef} role="region" aria-label="Player reviews" aria-roledescription="carousel" tabIndex={0} className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {[...reviews].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 10).map((r, i) => (
                  <article key={r._id || `${r.date}-${i}`} role="group" aria-roledescription="slide" aria-label={`Review ${i + 1} of ${Math.min(reviews.length, 10)}`} className="flex min-h-40 basis-[88%] shrink-0 snap-start flex-col rounded-2xl border border-white/10 bg-white/5 p-4 sm:basis-[70%] lg:basis-[82%]">
                    <p className="font-semibold text-lg">
                      {r.name || "Player"}{" "}
                      <span className="text-yellow-400 text-base" aria-label={`${r.rating || 0} out of 5 stars`}>
                        {"\u2605".repeat(Math.max(0, Math.min(5, Number(r.rating) || 0)))}
                      </span>
                      {r.verifiedBooking && <span className="ml-2 inline-flex items-center rounded-full bg-lime-400/10 px-2 py-0.5 align-middle text-[10px] font-semibold text-lime-300">Verified booking</span>}
                    </p>
                    {r.comment && <p className="mt-2 text-sm leading-6 text-gray-300 line-clamp-3">{r.comment}</p>}
                    {r.date && !Number.isNaN(new Date(r.date).getTime()) && <time className="mt-auto pt-3 text-xs text-gray-500" dateTime={new Date(r.date).toISOString()}>{new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</time>}
                  </article>
                ))}
              </div>
            </div>
          </Section>
        )}
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24 mt-5 rounded-3xl border border-white/10 bg-gray-900/80 p-6 shadow-2xl shadow-black/20">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-lime-400">Booking details</p>
          <h2 className="mt-2 text-xl font-bold text-white">{turf.name}</h2>
          {samePrice ? (
            <p className="mt-5 text-3xl font-extrabold">{"\u20b9"}{turf.dayPrice}<span className="ml-1 text-sm font-medium text-gray-400">/ hour</span></p>
          ) : (
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between gap-3"><span className="text-sm text-gray-300">Day</span><span className="font-bold">{"\u20b9"}{turf.dayPrice}<span className="font-normal text-gray-400"> /hr</span></span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-sm text-gray-300">Night</span><span className="font-bold">{"\u20b9"}{turf.nightPrice}<span className="font-normal text-gray-400"> /hr</span></span></div>
            </div>
          )}
          {turf.openingTime && turf.closingTime && (
            <p className="mt-4 border-t border-white/10 pt-4 text-sm text-gray-300">Open daily, {to12h(turf.openingTime)} to {to12h(turf.closingTime)}</p>
          )}
          <button onClick={() => goBook()} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime-400 px-4 text-base font-extrabold text-gray-950 shadow-lg shadow-lime-500/15 transition hover:bg-lime-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            Book Now <ChevronRight size={20} />
          </button>
          <p className="mt-3 text-center text-xs text-gray-500">Choose your date and time next</p>
        </div>
      </aside>
      </div>

      {/* One big button, always visible, sitting above the bottom menu */}
      <div className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+6rem)] left-0 right-0 z-40 px-4 sm:px-5 lg:hidden">
        <button
          onClick={() => goBook()}
          className="pointer-events-auto mx-auto flex min-h-12 w-full max-w-3xl items-center justify-center gap-2 rounded-xl bg-lime-400 py-3 text-lg font-extrabold text-gray-950 shadow-[0_10px_30px_rgba(163,230,53,0.35)] transition active:scale-[0.99]"
        >
          Book Now <ChevronRight size={24} className="stroke-[3]" />
        </button>
      </div>
    </div>
  );
};

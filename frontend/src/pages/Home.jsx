import React, { useEffect, useRef } from "react";
import { ArrowRightCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";

const Home = () => {
  const titleRef = useRef(null);
  const playRef = useRef(null);
  const bookingRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    gsap.fromTo(
      titleRef.current,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" }
    );

    gsap.fromTo(
      [playRef.current, bookingRef.current],
      { scale: 1, opacity: 0 },
      { scale: 1.08, opacity: 1, duration: 1.3, ease: "power1.out", stagger: 0.2 }
    );
  }, []);

  return (
    <div className="w-full h-screen flex flex-col mt-64 items-center  text-center px-4 ">
      <h1
        ref={titleRef}
        className="text-3xl md:text-5xl boldonse font-extrabold text-white mb-4 tracking-wide"
        style={{ textShadow: "0 0 10px rgba(173, 255, 47, 0.3)" }}
      >
        OUR ANGEL TURFS
      </h1>

      <p className="md:text-lg text-base font-medium san text-[#e7e5eb] mb-8">
        Use Energy to{" "}
        <span
          ref={playRef}
          className="text-lime-200 text-xl font-bold tracking-wide scale-105"
        >
          Play
        </span>{" "}
        not for{" "}
        <span
          ref={bookingRef}
          className="text-lime-200 text-xl font-bold tracking-wide scale-105"
        >
          Booking
        </span>
      </p>

      <button
        onClick={() => navigate("/turfs")}
        className="mt-4 flex items-center gap-2 text-white bg-lime-500 hover:bg-lime-600 transition-all duration-300 px-6 py-3 rounded-full shadow-lg sora font-semibold text-lg"
      >
        Explore Turfs
        <ArrowRightCircle size={22} />
      </button>
    </div>
  );
};

export default Home;

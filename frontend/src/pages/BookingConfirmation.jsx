import React from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

const BookingConfirmation = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { confirmation, turfName } = state || {};

  if (!confirmation) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="px-6 pt-16 text-white text-center max-w-md mx-auto">
      <div className="mx-auto w-24 h-24 rounded-full bg-lime-400 flex items-center justify-center">
        <Check size={56} className="text-gray-950 stroke-[3]" />
      </div>
      <h2 className="mt-6 text-3xl font-extrabold text-lime-400">
        Booking confirmed!
      </h2>
      <p className="mt-6 text-2xl font-bold">{confirmation.date}</p>
      <p className="mt-1 text-2xl font-bold">{confirmation.time}</p>
      <p className="mt-1 text-lg text-gray-300">{turfName}</p>
      {confirmation.payLater > 0 && (
        <p className="mt-5 text-xl">
          Pay at turf: <span className="font-extrabold">₹{confirmation.payLater}</span>
        </p>
      )}
      <p className="mt-4 text-lg text-gray-300">See you on the field!</p>
      <button
        onClick={() => navigate("/userBookings")}
        className="mt-8 w-full py-4 rounded-2xl bg-lime-400 text-gray-950 text-xl font-extrabold active:scale-95"
      >
        My bookings
      </button>
      <button
        onClick={() => navigate("/")}
        className="mt-3 w-full py-4 rounded-2xl border-2 border-white/20 text-xl font-bold active:scale-95"
      >
        Home
      </button>
    </div>
  );
};

export default BookingConfirmation;

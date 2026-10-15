import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Check } from "lucide-react";

const formatINR = (amount) => `\u20b9${(Number(amount) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [kind, setKind] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadConfirmation = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`/api/users/bookings/${bookingId}`);
      setRecord(data.booking || data.subscription);
      setKind(data.kind);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We couldn't load this booking confirmation.");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { loadConfirmation(); }, [loadConfirmation]);

  if (!bookingId) return <Navigate to="/userBookings" replace />;
  if (loading) return <div className="mx-auto max-w-lg px-6 py-20 text-center text-gray-200" role="status">Loading booking confirmation…</div>;
  if (error || !record) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center text-white">
        <p>{error || "Booking not found."}</p>
        <button onClick={loadConfirmation} className="mt-5 rounded-xl bg-lime-400 px-5 py-3 font-bold text-gray-950">Try again</button>
      </div>
    );
  }

  const total = kind === "subscription" ? record.totalAmount : record.slotFees;
  const remaining = Math.max(0, Number(total || 0) - Number(record.amountPaid || 0));
  const bookingDate = kind === "subscription" ? record.startDate : record.date;
  const dateLabel = bookingDate ? new Date(bookingDate).toLocaleDateString("en-IN", { dateStyle: "full" }) : "Date unavailable";
  const timeLabel = kind === "subscription"
    ? `${record.slot?.start || ""} – ${record.slot?.end || ""}`
    : (record.slots || []).map((slot) => `${slot.start} – ${slot.end}`).join(", ");
  const isCancelled = record.status === "cancelled";
  const isPaid = Number(record.amountPaid || 0) >= Number(total || 0);

  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-center text-white">
      <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${isCancelled ? "bg-red-400" : "bg-lime-400"}`}>
        <Check size={44} className="text-gray-950 stroke-[3]" />
      </div>
      <h1 className="mt-6 text-3xl font-extrabold text-lime-400">{isCancelled ? "Booking cancelled" : "Booking confirmed"}</h1>
      <p className="mt-5 text-xl font-bold">{dateLabel}</p>
      <p className="mt-1 text-xl font-bold">{timeLabel}</p>
      <p className="mt-1 text-lg text-gray-300">{record.turfId?.name || "GameTrack turf"}</p>
      <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-left">
        <div className="flex justify-between gap-4"><span className="text-gray-300">Total</span><strong>{formatINR(total)}</strong></div>
        <div className="flex justify-between gap-4"><span className="text-gray-300">Paid</span><strong>{formatINR(record.amountPaid)}</strong></div>
        <div className="flex justify-between gap-4"><span className="text-gray-300">Payment status</span><strong className={isPaid ? "text-lime-300" : "text-amber-300"}>{isPaid ? "Paid" : "Pay at turf"}</strong></div>
        {remaining > 0 && <div className="flex justify-between gap-4 border-t border-white/10 pt-3"><span className="text-gray-300">Due at turf</span><strong>{formatINR(remaining)}</strong></div>}
        <div className="flex justify-between gap-4"><span className="text-gray-300">Booking status</span><strong className="capitalize">{record.status || "confirmed"}</strong></div>
      </div>
      <button onClick={() => navigate("/userBookings")} className="mt-7 w-full rounded-2xl bg-lime-400 py-4 text-lg font-extrabold text-gray-950">My bookings</button>
      <button onClick={() => navigate("/")} className="mt-3 w-full rounded-2xl border-2 border-white/20 py-4 text-lg font-bold">Home</button>
    </div>
  );
};

export default BookingConfirmation;

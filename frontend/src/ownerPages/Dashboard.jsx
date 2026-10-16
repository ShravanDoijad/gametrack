import { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays, Clock3, Plus, ArrowRight, LoaderCircle,
  CalendarCheck, Wallet, CircleAlert,
} from "lucide-react";
import { BookContext } from "../constexts/bookContext";

const money = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0,
}).format(Number(value) || 0);

const dateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const timeLabel = (value) => {
  if (!value) return "Time not available";
  const [rawHour, rawMinute = "00"] = String(value).split(":");
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return "Time not available";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
};

const Dashboard = () => {
  const { selectedTurfId, turfs = [], bookings = [], ownerBookingsLoading } = useContext(BookContext);
  const today = dateKey(new Date());
  const selectedTurf = turfs.find((turf) => String(turf._id) === String(selectedTurfId));

  const todayBookings = useMemo(() => bookings
    .filter((booking) => dateKey(booking.date) === today && booking.status !== "cancelled")
    .sort((a, b) => String(a.slots?.[0]?.start || "").localeCompare(String(b.slots?.[0]?.start || ""))), [bookings, today]);

  const todayCollected = todayBookings.reduce((sum, booking) => sum + (Number(booking.amountPaid) || 0), 0);
  const todayPending = todayBookings.reduce((sum, booking) => sum + Math.max(0, (Number(booking.slotFees) || 0) - (Number(booking.amountPaid) || 0)), 0);
  const stats = [
    { label: "Bookings today", value: todayBookings.length, icon: CalendarCheck, detail: "Today's schedule" },
    { label: "Collected today", value: money(todayCollected), icon: Wallet, detail: "Payments recorded" },
    { label: "Money pending", value: money(todayPending), icon: CircleAlert, detail: "Balance to collect" },
  ];

  return (
    <div className="min-h-full bg-[#0a0a0a] px-4 py-5 text-white sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-sm text-gray-500">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Today&apos;s overview</h2>
            <p className="mt-1 text-sm text-gray-400">{selectedTurf?.name ? `Here's what's happening at ${selectedTurf.name}.` : "Here's what's happening at your turf."}</p>
          </div>
          <Link to="/owner/time-slots" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-lime-400 px-4 py-3 text-sm font-bold text-black transition hover:bg-lime-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]">
            <Plus size={18} aria-hidden="true" /> Add manual booking
          </Link>
        </section>

        {!selectedTurfId && <div role="status" className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">Select a turf to view its bookings and payments.</div>}

        <section aria-label="Today's business summary" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {stats.map(({ label, value, icon: Icon, detail }) => <article key={label} className="rounded-2xl border border-white/[0.08] bg-[#111] p-4 sm:p-5">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/10 text-lime-300"><Icon size={19} aria-hidden="true" /></div><p className="text-sm text-gray-400">{label}</p></div>
            <p className="mt-4 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">{ownerBookingsLoading ? <span className="inline-block h-8 w-20 animate-pulse rounded bg-white/10" aria-label="Loading" /> : value}</p>
            <p className="mt-1 text-xs text-gray-500">{detail}</p>
          </article>)}
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111]" aria-labelledby="today-schedule-heading">
          <div className="flex flex-col gap-3 border-b border-white/[0.08] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/10 text-lime-300"><CalendarDays size={19} aria-hidden="true" /></div><div><h3 id="today-schedule-heading" className="font-semibold">Today&apos;s schedule</h3><p className="mt-0.5 text-xs text-gray-500">See who&apos;s coming and when</p></div></div>
            <Link to="/owner/turfTodaysbookings" className="inline-flex min-h-10 items-center gap-1 self-start rounded-lg px-3 text-sm font-semibold text-lime-300 hover:bg-lime-400/10 sm:self-auto">View all <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>

          {ownerBookingsLoading ? <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-400" role="status"><LoaderCircle size={18} className="animate-spin text-lime-300" /> Loading today&apos;s bookings…</div>
            : todayBookings.length === 0 ? <div className="px-5 py-12 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-gray-400"><CalendarDays size={22} aria-hidden="true" /></div><h4 className="mt-4 font-semibold">No bookings for today</h4><p className="mt-1 text-sm text-gray-500">When a customer books, it will appear here.</p><Link to="/owner/time-slots" className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-lime-400 px-4 text-sm font-bold text-black hover:bg-lime-300"><Plus size={16} aria-hidden="true" /> Add manual booking</Link></div>
              : <div className="divide-y divide-white/[0.06]">
                {todayBookings.slice(0, 8).map((booking) => {
                  const name = booking.userId?.fullname || booking.fullname || booking.name || "Guest booking";
                  const slots = booking.originalSlots?.length ? booking.originalSlots : booking.slots || [];
                  const first = slots[0];
                  const last = slots[slots.length - 1];
                  const total = Number(booking.slotFees) || 0;
                  const paid = Number(booking.amountPaid) || 0;
                  const pending = Math.max(0, total - paid);
                  const status = String(booking.status || "confirmed").toLowerCase();
                  return <article key={booking._id} className="flex flex-col gap-3 px-4 py-4 transition hover:bg-white/[0.02] sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                    <div className="flex min-w-0 flex-1 items-start gap-3"><div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-lime-300"><Clock3 size={18} aria-hidden="true" /></div><div className="min-w-0"><p className="truncate font-semibold">{name}</p><p className="mt-1 text-sm text-gray-400">{first ? `${timeLabel(first.start)} – ${timeLabel(last?.end || first.end)}` : "Time not available"}</p><p className="mt-1 text-xs text-gray-500">{booking.paymentType === "Manual" ? "Manual booking" : "Booking"}{booking._id ? ` · Ref ${String(booking._id).slice(-6).toUpperCase()}` : ""}</p></div></div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end"><div className="sm:text-right"><p className="font-semibold">{money(total)}</p><p className={`mt-1 text-xs ${pending > 0 ? "text-amber-300" : "text-lime-300"}`}>{pending > 0 ? `${money(pending)} pending` : "Paid"}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${status === "cancelled" ? "bg-red-400/10 text-red-300" : status === "pending" ? "bg-amber-400/10 text-amber-300" : "bg-lime-400/10 text-lime-300"}`}>{status}</span></div>
                  </article>;
                })}
              </div>}
          {!ownerBookingsLoading && todayBookings.length > 8 && <div className="border-t border-white/[0.08] px-5 py-3"><Link to="/owner/turfTodaysbookings" className="text-sm font-semibold text-lime-300 hover:text-lime-200">See all {todayBookings.length} bookings <span aria-hidden="true">→</span></Link></div>}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;

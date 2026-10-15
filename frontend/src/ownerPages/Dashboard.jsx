import { useContext, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight, Banknote, CalendarDays, CalendarPlus, CheckCircle2,
  Clock3, RefreshCw, Wallet,
} from "lucide-react";
import { BookContext } from "../constexts/bookContext";

const money = (value) => `₹${(Number(value) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const dateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const minutes = (value) => {
  const [hours, mins] = String(value || "").split(":").map(Number);
  return Number.isFinite(hours) && Number.isFinite(mins) ? hours * 60 + mins : null;
};
const displayTime = (value) => {
  const minute = minutes(value);
  if (minute === null) return value || "—";
  const hour = Math.floor(minute / 60) % 24;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${String(minute % 60).padStart(2, "0")} ${suffix}`;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { bookings = [], ownerBookingsLoading, selectedTurfId, turfs = [], setCancelled } = useContext(BookContext);
  const turf = turfs.find((item) => item._id === selectedTurfId);
  const today = dateKey(new Date());
  const todayBookings = useMemo(() => bookings
    .filter((booking) => dateKey(booking.date) === today && booking.status !== "cancelled")
    .sort((a, b) => (minutes(a.slots?.[0]?.start) ?? 0) - (minutes(b.slots?.[0]?.start) ?? 0)), [bookings, today]);

  const collected = todayBookings.reduce((sum, booking) => sum + (Number(booking.amountPaid) || 0), 0);
  const pending = todayBookings.reduce((sum, booking) => sum + Math.max(0, (Number(booking.slotFees) || 0) - (Number(booking.amountPaid) || 0)), 0);
  const schedule = useMemo(() => {
    if (!turf?.openingTime || !turf?.closingTime) return [];
    const opening = minutes(turf.openingTime);
    const closing = minutes(turf.closingTime);
    if (opening === null || closing === null || closing <= opening) return [];
    const bookedDay = turf.bookedSlots?.find((day) => day.date === today);
    const intervals = (bookedDay?.slots || []).map((slot) => ({ start: minutes(slot.start), end: minutes(slot.end) }));
    const steps = [];
    for (let start = opening; start + 60 <= closing; start += 60) {
      const end = start + 60;
      const booking = todayBookings.find((item) => (item.slots || []).some((slot) => {
        const slotStart = minutes(slot.start);
        const slotEnd = minutes(slot.end);
        return slotStart !== null && slotEnd !== null && start < slotEnd && end > slotStart;
      }));
      const blocked = bookedDay?.status === "unavailable" || intervals.some((slot) => slot.start !== null && slot.end !== null && start < slot.end && end > slot.start);
      steps.push({ start, end, booking, blocked: blocked && !booking });
    }
    return steps;
  }, [turf, today, todayBookings]);

  const availableCount = schedule.filter((slot) => !slot.booking && !slot.blocked).length;
  const cards = [
    { label: "Bookings today", value: todayBookings.length, detail: "Confirmed reservations", icon: CalendarDays, tone: "text-emerald-700 bg-emerald-50" },
    { label: "Collected today", value: money(collected), detail: "Payments received", icon: Wallet, tone: "text-blue-700 bg-blue-50" },
    { label: "Still to collect", value: money(pending), detail: "Outstanding on today’s bookings", icon: Banknote, tone: "text-amber-700 bg-amber-50" },
    { label: "Available slots", value: schedule.length ? availableCount : "—", detail: schedule.length ? "One-hour slots remaining" : "Set operating hours to see slots", icon: Clock3, tone: "text-violet-700 bg-violet-50" },
  ];

  const actions = [
    { label: "Add a booking", description: "Reserve a slot for a caller or walk-in", to: "/owner/time-slots", icon: CalendarPlus, primary: true },
    { label: "View calendar", description: "Check availability and manage slots", to: "/owner/time-slots", icon: CalendarDays },
    { label: "Track payments", description: "Review collections and balances", to: "/owner/revenue", icon: Wallet },
    { label: "Manage bookings", description: "Search and update reservations", to: "/owner/bookings", icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-full bg-slate-50 px-4 py-5 text-slate-900 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Today at a glance</h1>
            <p className="mt-1 text-sm text-slate-600">{turf?.name || "Your turf"}{turf?.location?.city ? ` · ${turf.location.city}` : ""}</p>
          </div>
          <button
            type="button"
            onClick={() => setCancelled((value) => !value)}
            disabled={ownerBookingsLoading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-60"
          >
            <RefreshCw size={16} className={ownerBookingsLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </header>

        {!selectedTurfId && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900" role="status">
            Select or set up a turf to see bookings and availability.
          </div>
        )}

        <section aria-label="Today's business summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, detail, icon: Icon, tone }) => (
            <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon size={19} /></div>
                <span className="text-xs font-medium text-slate-500">Today</span>
              </div>
              <p className="mt-4 text-2xl font-bold tabular-nums">{ownerBookingsLoading ? "…" : value}</p>
              <h2 className="mt-1 text-sm font-semibold text-slate-700">{label}</h2>
              <p className="mt-1 text-xs text-slate-500">{detail}</p>
            </article>
          ))}
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(17rem,0.8fr)]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="today-schedule-title">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
              <div>
                <h2 id="today-schedule-title" className="text-lg font-bold">Today’s schedule</h2>
                <p className="mt-0.5 text-sm text-slate-500">Bookings and open one-hour slots</p>
              </div>
              <Link to="/owner/time-slots" className="inline-flex min-h-10 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
                Open calendar <ArrowRight size={15} />
              </Link>
            </div>
            {ownerBookingsLoading ? (
              <div className="p-8 text-center text-sm text-slate-500" role="status">Loading today’s schedule…</div>
            ) : !selectedTurfId ? null : schedule.length === 0 ? (
              <div className="p-8 text-center">
                <CalendarDays className="mx-auto text-slate-400" size={28} />
                <p className="mt-3 font-semibold">Operating hours aren’t set</p>
                <p className="mt-1 text-sm text-slate-500">Add your opening and closing times to show today’s slots.</p>
                <Link to="/owner/turf-profile" className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">Set operating hours</Link>
              </div>
            ) : (
              <ol className="divide-y divide-slate-100">
                {schedule.slice(0, 12).map((slot) => {
                  const status = slot.booking ? "Booked" : slot.blocked ? "Blocked" : "Available";
                  const who = slot.booking?.userId?.fullname || slot.booking?.fullname || slot.booking?.phone || "Customer";
                  const total = Number(slot.booking?.slotFees) || 0;
                  const paid = Number(slot.booking?.amountPaid) || 0;
                  return (
                    <li key={slot.start} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                      <time className="w-28 shrink-0 text-sm font-semibold tabular-nums text-slate-700">{displayTime(`${String(Math.floor(slot.start / 60)).padStart(2, "0")}:${String(slot.start % 60).padStart(2, "0")}`)} – {displayTime(`${String(Math.floor(slot.end / 60)).padStart(2, "0")}:${String(slot.end % 60).padStart(2, "0")}`)}</time>
                      <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ${slot.booking ? "bg-emerald-100 text-emerald-800" : slot.blocked ? "bg-slate-200 text-slate-700" : "bg-blue-50 text-blue-800"}`}>{status}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{slot.booking ? who : slot.blocked ? "Unavailable for booking" : "Open for booking"}</p>
                        {slot.booking && <p className="mt-0.5 text-xs text-slate-500">{slot.booking.paymentType === "Manual" ? "Manual" : "Online"} · {money(paid)} received{total > paid ? ` · ${money(total - paid)} due` : " · Paid"}</p>}
                      </div>
                      {!slot.booking && !slot.blocked && (
                        <button type="button" onClick={() => navigate("/owner/time-slots", { state: { date: today, startTime: slot.start } })} className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">Add booking</button>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
            {schedule.length > 12 && <div className="border-t border-slate-100 px-5 py-3 text-sm text-slate-500">Showing first 12 slots · <Link to="/owner/time-slots" className="font-semibold text-emerald-800">See full calendar</Link></div>}
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-bold">Quick actions</h2>
            <p className="mt-1 text-sm text-slate-500">Common tasks, one tap away.</p>
            <div className="mt-4 space-y-2">
              {actions.map(({ label, description, to, icon: Icon, primary }) => (
                <Link key={label} to={to} className={`flex min-h-[4.25rem] items-center gap-3 rounded-xl border p-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${primary ? "border-emerald-800 bg-emerald-800 text-white hover:bg-emerald-900" : "border-slate-200 bg-white text-slate-800 hover:border-emerald-300 hover:bg-emerald-50"}`}>
                  <Icon size={19} className={primary ? "shrink-0 text-white" : "shrink-0 text-emerald-800"} />
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{label}</span><span className={`mt-0.5 block text-xs ${primary ? "text-emerald-100" : "text-slate-500"}`}>{description}</span></span>
                  <ArrowRight size={16} className="shrink-0" />
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Banknote, CalendarDays, Clock3, RefreshCw, Wallet } from "lucide-react";
import { BookContext } from "../constexts/bookContext";

const money = (value) => `₹${(Number(value) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const dateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Revenue = () => {
  const { bookings = [], ownerBookingsLoading, setCancelled } = useContext(BookContext);
  const [period, setPeriod] = useState("today");
  const today = dateKey(new Date());
  const month = today.slice(0, 7);

  const visibleBookings = useMemo(() => bookings.filter((booking) => {
    if (booking.status === "cancelled") return false;
    const key = dateKey(booking.date);
    if (period === "today") return key === today;
    if (period === "month") return key.startsWith(month);
    return true;
  }), [bookings, period, today, month]);

  const totals = visibleBookings.reduce((summary, booking) => {
    const total = Number(booking.slotFees) || 0;
    const collected = Math.min(total, Number(booking.amountPaid) || 0);
    summary.value += total;
    summary.pending += Math.max(0, total - collected);
    return summary;
  }, { value: 0, collected: 0, pending: 0 });

  const entries = bookings.filter((booking) => booking.status !== "cancelled").flatMap((booking) => {
    const customer = booking.userId?.fullname || booking.fullname || booking.phone || "Customer";
    const events = booking.paymentHistory || [];
    if (events.length) {
      return events.map((event, index) => ({
        id: `${booking._id}-${event._id || index}`,
        bookingId: booking._id,
        customer,
        amount: Number(event.amount) || 0,
        method: event.method || "Other",
        receivedAt: event.receivedAt || booking.createdAt,
        legacy: false,
      }));
    }
    if (Number(booking.amountPaid) > 0) {
      return [{
        id: `${booking._id}-legacy`,
        bookingId: booking._id,
        customer,
        amount: Number(booking.amountPaid),
        method: booking.razorpay_payment_id ? "Online" : "Payment on booking (legacy)",
        receivedAt: booking.createdAt || booking.date,
        legacy: true,
      }];
    }
    return [];
  }).filter((entry) => {
    const key = dateKey(entry.receivedAt);
    if (period === "today") return key === today;
    if (period === "month") return key.startsWith(month);
    return true;
  }).sort((a, b) => new Date(b.receivedAt || 0) - new Date(a.receivedAt || 0));

  totals.collected = entries.reduce((sum, entry) => sum + entry.amount, 0);

  const cards = [
    { label: "Booking value", value: totals.value, helper: "Value of active bookings", icon: CalendarDays, color: "text-slate-700 bg-slate-100" },
    { label: "Collected", value: totals.collected, helper: "Payments recorded as received", icon: Wallet, color: "text-emerald-800 bg-emerald-50" },
    { label: "Outstanding", value: totals.pending, helper: "Remaining customer balances", icon: Banknote, color: "text-amber-800 bg-amber-50" },
  ];

  return (
    <div className="min-h-full bg-slate-50 px-4 py-5 text-slate-900 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Owner tools</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Payments</h1>
            <p className="mt-1 text-sm text-slate-600">See what was booked, what was received, and what is still due.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "today", label: "Today" },
              { id: "month", label: "This month" },
              { id: "all", label: "All time" },
            ].map((option) => (
              <button key={option.id} type="button" onClick={() => setPeriod(option.id)} aria-pressed={period === option.id} className={`min-h-11 rounded-xl border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${period === option.id ? "border-emerald-800 bg-emerald-800 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"}`}>{option.label}</button>
            ))}
            <button type="button" onClick={() => setCancelled((value) => !value)} disabled={ownerBookingsLoading} aria-label="Refresh payments" className="flex min-h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-60"><RefreshCw size={16} className={ownerBookingsLoading ? "animate-spin" : ""} /></button>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3" aria-label="Payment summary">
          {cards.map(({ label, value, helper, icon: Icon, color }) => (
            <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon size={19} /></div><span className="text-xs font-medium text-slate-500">{period === "today" ? "Today" : period === "month" ? "This month" : "All time"}</span></div>
              <p className="mt-4 text-2xl font-bold tabular-nums">{ownerBookingsLoading ? "…" : money(value)}</p>
              <h2 className="mt-1 text-sm font-semibold">{label}</h2>
              <p className="mt-1 text-xs text-slate-500">{helper}</p>
            </article>
          ))}
        </section>

        {totals.pending > 0 && (
          <section className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5" aria-label="Outstanding balances">
            <div><h2 className="font-bold text-amber-950">Balances need follow-up</h2><p className="mt-1 text-sm text-amber-900">{money(totals.pending)} is still due across {visibleBookings.filter((booking) => Number(booking.slotFees) > Number(booking.amountPaid || 0)).length} booking(s).</p></div>
            <Link to="/owner/bookings" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-950 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700">Review bookings <ArrowRight size={16} /></Link>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="payment-history-title">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
            <div><h2 id="payment-history-title" className="text-lg font-bold">Payment history</h2><p className="mt-0.5 text-sm text-slate-500">Recorded collections for active bookings</p></div>
            <Link to="/owner/bookings" className="inline-flex min-h-10 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50">Manage balances <ArrowRight size={15} /></Link>
          </div>
          {ownerBookingsLoading ? <div className="p-8 text-center text-sm text-slate-500" role="status">Loading payment records…</div> : entries.length === 0 ? (
            <div className="p-8 text-center"><Clock3 className="mx-auto text-slate-400" size={28} /><p className="mt-3 font-semibold">No payments recorded in this period</p><p className="mt-1 text-sm text-slate-500">Once a payment is recorded against a booking, it will appear here.</p></div>
          ) : (
            <>
              <div className="hidden overflow-x-auto sm:block"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Customer / booking</th><th className="px-5 py-3">Method</th><th className="px-5 py-3">Received</th><th className="px-5 py-3 text-right">Amount</th></tr></thead><tbody className="divide-y divide-slate-100">{entries.map((entry) => <tr key={entry.id} className="hover:bg-slate-50"><td className="px-5 py-4"><span className="font-semibold">{entry.customer}</span><span className="mt-0.5 block text-xs text-slate-500">Booking · {entry.bookingId.slice(-7)}</span></td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">{entry.method}</span>{entry.legacy && <span className="ml-2 text-xs text-slate-500">Older record</span>}</td><td className="px-5 py-4 text-slate-600">{entry.receivedAt ? new Date(entry.receivedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Date unavailable"}</td><td className="px-5 py-4 text-right font-bold tabular-nums text-emerald-800">{money(entry.amount)}</td></tr>)}</tbody></table></div>
              <ul className="divide-y divide-slate-100 sm:hidden">{entries.map((entry) => <li key={entry.id} className="flex items-start justify-between gap-3 p-4"><div className="min-w-0"><p className="truncate text-sm font-semibold">{entry.customer}</p><p className="mt-1 text-xs text-slate-600">{entry.method}{entry.legacy ? " · Older record" : ""}</p><p className="mt-1 text-xs text-slate-500">{entry.receivedAt ? new Date(entry.receivedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Date unavailable"}</p></div><strong className="shrink-0 text-sm tabular-nums text-emerald-800">{money(entry.amount)}</strong></li>)}</ul>
            </>
          )}
        </section>
        <p className="text-xs leading-relaxed text-slate-500">Older bookings may not contain a separate method or payment timestamp. They’re shown as older records using their saved amount and booking date. Online payments are added only after backend payment verification.</p>
      </div>
    </div>
  );
};

export default Revenue;

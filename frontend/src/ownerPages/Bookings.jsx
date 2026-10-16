import { useState, useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Calendar, ArrowUpDown, AlertCircle, XCircle,
  CheckCircle, Download, User, Phone, Search, ListChecks, Wallet
} from "lucide-react";
import { BookContext } from "../constexts/bookContext";
import { toast } from "react-toastify";

const statusStyle = {
  confirmed: "text-green-800 bg-green-50 border border-green-200",
  cancelled: "text-red-700 bg-red-50 border border-red-200",
  pending:   "text-amber-800 bg-amber-50 border border-amber-200",
};

const fmtDate = d => new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
const fmtTime = t => {
  if (!t) return "";
  try {
    const [h, m] = t.split(":"); const hr = parseInt(h);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
  } catch { return t; }
};

const FILTERS = [
  { key: "all",      label: "All"       },
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming"  },
  { key: "completed",label: "Completed" },
  { key: "cancelled",label: "Cancelled" },
];

const dateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Bookings = () => {
  const { bookings, selectedTurfId, setCancelled } = useContext(BookContext);
  const [filter, setFilter]       = useState("all");
  const [sort, setSort]           = useState("desc");
  const [search, setSearch]       = useState("");
  const [modal, setModal]         = useState({ open: false, booking: null });
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingCancel, setSavingCancel] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMonth, setExportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const today = new Date(); today.setHours(0,0,0,0);

  const filtered = bookings
    .filter(b => {
      const bd = new Date(b.date);
      switch (filter) {
        case "today": return dateKey(b.date) === dateKey(today) && b.status !== "cancelled";
        case "upcoming":  return bd >= today && b.status !== "cancelled";
        case "completed": return bd < today && b.status !== "cancelled";
        case "cancelled": return b.status === "cancelled";
        default: return true;
      }
    })
    .filter(b => {
      if (!search) return true;
      const q = search.toLowerCase();
      const name  = (b.userId?.name || b.userId?.fullname || b.fullname || "").toLowerCase();
      const phone = (b.userId?.phone || b.phone || "");
      return name.includes(q) || phone.includes(q);
    })
    .sort((a, b) => {
      const da = new Date(a.date), db = new Date(b.date);
      return sort === "asc" ? da - db : db - da;
    });

  const getUserInfo = b => b.userId
    ? { name: b.userId.name || b.userId.fullname || "—", phone: b.userId.phone || "—" }
    : { name: b.fullname || "Guest", phone: b.phone || "—" };

  const cancelBooking = async (b) => {
    if (savingCancel) return;
    setSavingCancel(true);
    try {
      await axios.post("/owner/cancelBooking", {
        bookingId: b._id, turfId: selectedTurfId, date: dateKey(b.date),
        start: b.originalSlots?.[0]?.start || b.slots[0].start,
        end:   b.originalSlots?.[0]?.end   || b.slots[0].end,
      });
      toast.success("Booking cancelled");
      setCancelled(p => !p);
      setModal({ open: false, booking: null });
    } catch {
      toast.error("Failed to cancel booking");
    } finally {
      setSavingCancel(false);
    }
  };

  const recordPayment = async () => {
    if (!paymentModal || savingPayment) return;
    setSavingPayment(true);
    try {
      await axios.post(`/owner/bookings/${paymentModal._id}/payments`, {
        turfId: selectedTurfId,
        amount: Number(paymentAmount),
        method: paymentMethod,
      });
      toast.success("Payment recorded.");
      setPaymentModal(null);
      setPaymentAmount("");
      setCancelled((value) => !value);
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn’t record this payment. Please try again.");
    } finally {
      setSavingPayment(false);
    }
  };

  const downloadPDF = async () => {
    if (!selectedTurfId || isExporting) return;
    const [year, month] = exportMonth.split("-").map(Number);
    setIsExporting(true);
    try {
      const res = await axios.get("/owner/generate-bookings-pdf", {
        responseType: "blob",
        params: { month, year, turfId: selectedTurfId },
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `gametrack-bookings-${exportMonth}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Bookings report downloaded.");
    } catch {
      toast.error("Could not export this month's bookings.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 px-4 py-5 text-slate-900 sm:px-6 sm:py-7 lg:px-8">

      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="record-payment-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            <h2 id="record-payment-title" className="text-lg font-bold text-slate-900">Record a payment</h2>
            <p className="mt-1 text-sm text-slate-600">{getUserInfo(paymentModal).name} · balance ₹{Math.max(0, Number(paymentModal.slotFees || 0) - Number(paymentModal.amountPaid || 0)).toLocaleString("en-IN")}</p>
            {(paymentModal.paymentHistory || []).length > 0 && <div className="mt-4 rounded-xl border border-slate-200 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Previous payments</p><ul className="mt-2 space-y-1">{paymentModal.paymentHistory.slice(-4).reverse().map((entry, index) => <li key={entry._id || index} className="flex justify-between gap-3 text-sm"><span className="capitalize text-slate-600">{entry.method || "Payment"}</span><span className="font-semibold text-slate-900">₹{Number(entry.amount || 0).toLocaleString("en-IN")}</span></li>)}</ul></div>}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">Amount received<input type="number" min="0.01" max={Math.max(0, Number(paymentModal.slotFees || 0) - Number(paymentModal.amountPaid || 0))} step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100" /></label>
              <label className="text-sm font-semibold text-slate-700">Method<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"><option value="cash">Cash</option><option value="upi">UPI</option><option value="other">Other</option></select></label>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setPaymentModal(null)} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">Close</button>
              <button type="button" onClick={recordPayment} disabled={savingPayment || !(Number(paymentAmount) > 0)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#15803D] px-4 text-sm font-bold text-white hover:bg-[#166534] disabled:cursor-not-allowed disabled:opacity-50"><Wallet size={16} />{savingPayment ? "Saving…" : "Confirm payment received"}</button>
            </div>
          </section>
        </div>
      )}

      {/* Cancel modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl mx-4">
            <XCircle className="mx-auto text-red-700 h-10 w-10 mb-3" />
            <h2 className="text-slate-900 text-lg font-semibold text-center">Cancel booking?</h2>
            <p className="text-slate-500 text-sm text-center mt-1 mb-5">This will free up the slot for other users.</p>
            <div className="flex gap-3">
              <button
                onClick={() => cancelBooking(modal.booking)}
                disabled={savingCancel}
                className="flex-1 bg-red-700 hover:bg-red-800 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition"
              >
                <CheckCircle size={15} /> {savingCancel ? "Cancelling…" : "Yes, cancel"}
              </button>
              <button
                onClick={() => setModal({ open: false, booking: null })}
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-2.5 rounded-xl text-sm transition"
              >
                Keep it
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1440px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/owner/time-slots" className="flex min-h-11 items-center gap-2 rounded-xl bg-[#15803D] px-4 text-sm font-semibold text-white transition hover:bg-[#166534]">
              <Calendar size={15} /> Add booking
            </Link>
            <Link
              to="/owner/turfTodaysbookings"
              className="flex min-h-11 items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 text-sm font-medium text-green-800 transition hover:bg-green-100"
            >
              <ListChecks size={15} /> Today
            </Link>
            <label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600">
              <span>Report month</span>
              <input
                type="month"
                aria-label="Choose report month"
                value={exportMonth}
                onChange={(event) => setExportMonth(event.target.value)}
                className="min-w-0 bg-transparent text-sm text-slate-900 outline-none [color-scheme:light]"
              />
            </label>
            <button
              type="button"
              onClick={downloadPDF}
              disabled={isExporting || !selectedTurfId || !exportMonth}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-green-300 hover:text-slate-900 disabled:cursor-wait disabled:opacity-60"
            >
              <Download size={15} /> {isExporting ? "Preparing..." : "Export PDF"}
            </button>
          </div>
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  filter === f.key
                    ? "bg-[#15803D] text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 sm:ml-auto">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search customer…"
                className="bg-white border border-slate-200 text-sm text-slate-900 pl-9 pr-4 py-1.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-200 w-44 placeholder:text-slate-500"
              />
            </div>
            <button
              onClick={() => setSort(s => s === "asc" ? "desc" : "asc")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs hover:text-slate-900 transition"
            >
              <ArrowUpDown size={13} />
              {sort === "asc" ? "Oldest" : "Newest"}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="hidden overflow-x-auto sm:block">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  {["Date", "Slots", "Customer", "Collected", "Balance", "Status", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                      <AlertCircle size={32} className="mx-auto mb-2 opacity-30" />
                      No bookings found
                    </td>
                  </tr>
                ) : filtered.map(b => {
                  const user = getUserInfo(b);
                  const slots = b.originalSlots || b.slots || [];
                  const balance = Math.max(0, (b.slotFees || 0) - (b.amountPaid || 0));
                  return (
                    <tr key={b._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={13} className="text-slate-500 flex-shrink-0" />
                          <span className="text-slate-900 font-medium whitespace-nowrap">{fmtDate(b.date)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          {slots.slice(0, 2).map((s, i) => (
                            <div key={i} className="text-slate-600 text-xs whitespace-nowrap">
                              {fmtTime(s.start)} – {fmtTime(s.end)}
                            </div>
                          ))}
                          {slots.length > 2 && (
                            <div className="text-slate-500 text-[10px]">+{slots.length - 2} more</div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-slate-900 font-medium">
                          <User size={13} className="text-slate-500" />
                          {user.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-0.5">
                          <Phone size={11} />
                          {user.phone}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-amber-800 font-semibold">₹{b.amountPaid || 0}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={balance > 0 ? "text-red-700 font-semibold" : "text-slate-500"}>
                          ₹{balance}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg capitalize ${statusStyle[b.status] || statusStyle.pending}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {balance > 0 && b.status !== "cancelled" && <button type="button" onClick={() => { setPaymentModal(b); setPaymentAmount(""); }} className="min-h-10 rounded-lg border border-green-200 bg-[#15803D]/10 px-3 text-xs font-semibold text-green-800 hover:bg-[#15803D]/20">Record payment</button>}
                          {b.status !== "cancelled" && <button type="button" onClick={() => setModal({ open: true, booking: b })} className="min-h-10 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 hover:bg-red-100">Cancel</button>}
                          {b.status === "cancelled" && <span className="text-xs text-slate-500">Cancelled</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-slate-100 sm:hidden">
            {filtered.length === 0 ? <li className="p-8 text-center text-sm text-slate-500">No bookings match this filter.</li> : filtered.map((booking) => {
              const customer = getUserInfo(booking);
              const slots = booking.originalSlots || booking.slots || [];
              const due = Math.max(0, Number(booking.slotFees || 0) - Number(booking.amountPaid || 0));
              return <li key={booking._id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{customer.name}</p><p className="mt-1 text-xs text-slate-600">{fmtDate(booking.date)} · {slots.map((slot) => `${fmtTime(slot.start)}–${fmtTime(slot.end)}`).join(", ")}</p><p className="mt-1 text-xs text-slate-500">{customer.phone}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle[booking.status] || statusStyle.pending}`}>{booking.status}</span></div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className="text-slate-600">Collected <strong className="text-slate-900">₹{Number(booking.amountPaid || 0).toLocaleString("en-IN")}</strong></span><span className="text-slate-600">Due <strong className={due ? "text-amber-800" : "text-slate-600"}>₹{due.toLocaleString("en-IN")}</strong></span></div>
                <div className="flex gap-2">{due > 0 && booking.status !== "cancelled" && <button type="button" onClick={() => { setPaymentModal(booking); setPaymentAmount(""); }} className="min-h-11 flex-1 rounded-xl bg-[#15803D] px-3 text-sm font-bold text-white">Record payment</button>}{booking.status !== "cancelled" && <button type="button" onClick={() => setModal({ open: true, booking })} className="min-h-11 rounded-xl border border-red-300 px-3 text-sm font-semibold text-red-700">Cancel</button>}</div>
              </li>;
            })}
          </ul>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
            <span>
              Showing <span className="text-slate-600 font-medium">{filtered.length}</span> of{" "}
              <span className="text-slate-600 font-medium">{bookings.length}</span> bookings
            </span>
            <span>Updated {new Date().toLocaleTimeString("en-IN")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bookings;

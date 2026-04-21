import React, { useState, useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Calendar, ArrowUpDown, AlertCircle, XCircle,
  CheckCircle, Download, User, Phone, Search, ListChecks
} from "lucide-react";
import { BookContext } from "../constexts/bookContext";
import { toast } from "react-toastify";

const statusStyle = {
  confirmed: "text-lime-400 bg-lime-400/10 border border-lime-400/20",
  cancelled: "text-red-400 bg-red-400/10 border border-red-400/20",
  pending:   "text-amber-400 bg-amber-400/10 border border-amber-400/20",
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
  { key: "upcoming", label: "Upcoming"  },
  { key: "confirmed",label: "Confirmed" },
  { key: "cancelled",label: "Cancelled" },
  { key: "manual",   label: "Manual"    },
  { key: "past",     label: "Past"      },
];

const Bookings = () => {
  const { bookings, setbookings, selectedTurfId, setCancelled } = useContext(BookContext);
  const [filter, setFilter]       = useState("all");
  const [sort, setSort]           = useState("desc");
  const [search, setSearch]       = useState("");
  const [modal, setModal]         = useState({ open: false, booking: null });

  const today = new Date(); today.setHours(0,0,0,0);

  const filtered = bookings
    .filter(b => {
      const bd = new Date(b.date);
      switch (filter) {
        case "upcoming":  return bd >= today && b.status !== "cancelled";
        case "past":      return bd < today  && b.status !== "cancelled";
        case "cancelled": return b.status === "cancelled";
        case "confirmed": return b.status === "confirmed";
        case "manual":    return b.paymentType?.toLowerCase() === "manual";
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
    try {
      await axios.post("/owner/cancelBooking", {
        bookingId: b._id, turfId: selectedTurfId, date: b.date,
        start: b.originalSlots?.[0]?.start || b.slots[0].start,
        end:   b.originalSlots?.[0]?.end   || b.slots[0].end,
      });
      toast.success("Booking cancelled");
      setCancelled(p => !p);
    } catch {
      toast.error("Failed to cancel booking");
    }
  };

  const downloadPDF = async () => {
    try {
      const res = await axios.get("/owner/generate-bookings-pdf", {
        responseType: "blob",
        params: { month: new Date().getMonth()+1, year: new Date().getFullYear(), turfId: selectedTurfId }
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a"); a.href = url;
      a.download = `bookings-${new Date().toLocaleDateString("en-US", { month:"long", year:"numeric" })}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch { toast.error("Failed to download PDF"); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-4 sm:px-6 py-5 font-sora">

      {/* Cancel modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl mx-4">
            <XCircle className="mx-auto text-red-400 h-10 w-10 mb-3" />
            <h2 className="text-white text-lg font-semibold text-center">Cancel booking?</h2>
            <p className="text-gray-500 text-sm text-center mt-1 mb-5">This will free up the slot for other users.</p>
            <div className="flex gap-3">
              <button
                onClick={() => { cancelBooking(modal.booking); setModal({ open: false, booking: null }); }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition"
              >
                <CheckCircle size={15} /> Yes, cancel
              </button>
              <button
                onClick={() => setModal({ open: false, booking: null })}
                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-2.5 rounded-xl text-sm transition"
              >
                Keep it
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Bookings</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" })}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/owner/turfTodaysbookings"
              className="flex items-center gap-2 px-4 py-2 bg-lime-500/15 border border-lime-500/30 text-lime-400 rounded-xl text-sm font-medium hover:bg-lime-500/20 transition"
            >
              <ListChecks size={15} /> Today
            </Link>
            <button
              onClick={downloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-white/10 text-gray-300 rounded-xl text-sm hover:border-white/20 hover:text-white transition"
            >
              <Download size={15} /> Export PDF
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
                    ? "bg-lime-500 text-black"
                    : "bg-[#111] border border-white/5 text-gray-400 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 sm:ml-auto">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search customer…"
                className="bg-[#111] border border-white/5 text-sm text-white pl-9 pr-4 py-1.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-lime-500/50 w-44 placeholder:text-gray-600"
              />
            </div>
            <button
              onClick={() => setSort(s => s === "asc" ? "desc" : "asc")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111] border border-white/5 text-gray-400 rounded-xl text-xs hover:text-white transition"
            >
              <ArrowUpDown size={13} />
              {sort === "asc" ? "Oldest" : "Newest"}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {["Date", "Slots", "Customer", "Advance", "Balance", "Status", "Action"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-600">
                      <AlertCircle size={32} className="mx-auto mb-2 opacity-30" />
                      No bookings found
                    </td>
                  </tr>
                ) : filtered.map(b => {
                  const user = getUserInfo(b);
                  const slots = b.originalSlots || b.slots || [];
                  const balance = Math.max(0, (b.slotFees || 0) - (b.amountPaid || 0));
                  return (
                    <tr key={b._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={13} className="text-gray-600 flex-shrink-0" />
                          <span className="text-white font-medium whitespace-nowrap">{fmtDate(b.date)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          {slots.slice(0, 2).map((s, i) => (
                            <div key={i} className="text-gray-300 text-xs whitespace-nowrap">
                              {fmtTime(s.start)} – {fmtTime(s.end)}
                            </div>
                          ))}
                          {slots.length > 2 && (
                            <div className="text-gray-600 text-[10px]">+{slots.length - 2} more</div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-white font-medium">
                          <User size={13} className="text-gray-600" />
                          {user.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-0.5">
                          <Phone size={11} />
                          {user.phone}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-amber-400 font-semibold">₹{b.amountPaid || 0}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={balance > 0 ? "text-red-400 font-semibold" : "text-gray-600"}>
                          ₹{balance}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg capitalize ${statusStyle[b.status] || statusStyle.pending}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setModal({ open: true, booking: b })}
                          disabled={b.status === "cancelled"}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                            b.status === "cancelled"
                              ? "text-gray-600 bg-white/[0.03] cursor-not-allowed"
                              : "text-red-400 bg-red-400/10 hover:bg-red-400/20 border border-red-400/20"
                          }`}
                        >
                          {b.status === "cancelled" ? "Cancelled" : "Cancel"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-white/5 flex justify-between items-center text-xs text-gray-600">
            <span>
              Showing <span className="text-gray-400 font-medium">{filtered.length}</span> of{" "}
              <span className="text-gray-400 font-medium">{bookings.length}</span> bookings
            </span>
            <span>Updated {new Date().toLocaleTimeString("en-IN")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bookings;

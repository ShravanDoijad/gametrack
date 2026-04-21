import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import {
  User, Mail, Phone, CalendarDays,
  Loader2, Star, Crown, Activity,
  TrendingUp, Zap, Award, Clock, Search
} from "lucide-react";
import moment from "moment";
import { BookContext } from "../constexts/bookContext";

const classify = (customer, allCustomers) => {
  const count = allCustomers.filter(c => c.userId === customer.userId).length;
  const days  = moment().diff(moment(customer.bookingDate), "days");
  if (count > 5 && days <= 10)  return "VIP";
  if (count > 3 || days <= 15)  return "Regular";
  if (count > 1 && days <= 30)  return "Active";
  return "Inactive";
};

const statusConfig = {
  VIP:      { color: "text-amber-400",  bg: "bg-amber-400/10",  border: "border-amber-400/20",  icon: Crown,    badge: "from-amber-500 to-yellow-400"  },
  Regular:  { color: "text-lime-400",   bg: "bg-lime-400/10",   border: "border-lime-400/20",   icon: Star,     badge: "from-lime-500 to-emerald-400"  },
  Active:   { color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/20",   icon: Activity, badge: "from-blue-500 to-cyan-400"     },
  Inactive: { color: "text-gray-400",   bg: "bg-gray-400/10",   border: "border-gray-400/20",   icon: Clock,    badge: "from-gray-600 to-gray-500"     },
};

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("all");
  const [search, setSearch]       = useState("");
  const { selectedTurfId }        = useContext(BookContext);

  useEffect(() => {
    axios.get(`/owner/customers?turfId=${selectedTurfId}`)
      .then(r => setCustomers(r.data.customers || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedTurfId]);

  const displayed = customers.filter(c => {
    const matchFilter = filter === "all" || classify(c, customers) === filter;
    if (!search) return matchFilter;
    const q = search.toLowerCase();
    return matchFilter && (
      (c.name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.phone || "").includes(q)
    );
  });

  const counts = ["VIP","Regular","Active","Inactive"].reduce((acc, s) => {
    acc[s] = customers.filter(c => classify(c, customers) === s).length;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-lime-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-5 font-sora">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Customers</h1>
            <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1.5">
              <Zap size={13} className="text-lime-400" />
              {customers.length} total · smart classification
            </p>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, phone…"
              className="bg-[#111] border border-white/5 text-sm text-white pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-lime-500/50 w-64 placeholder:text-gray-600"
            />
          </div>
        </div>

        {/* Segment counts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: "all",      label: "All",      count: customers.length, icon: TrendingUp, color: "text-white",   bg: "bg-white/5"      },
            { key: "VIP",      label: "VIP",       count: counts.VIP,       icon: Crown,      color: "text-amber-400", bg: "bg-amber-500/10" },
            { key: "Regular",  label: "Regular",   count: counts.Regular,   icon: Star,       color: "text-lime-400",  bg: "bg-lime-500/10"  },
            { key: "Active",   label: "Active",    count: counts.Active,    icon: Activity,   color: "text-blue-400",  bg: "bg-blue-500/10"  },
          ].map(({ key, label, count, icon: Icon, color, bg }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left
                ${filter === key ? "border-white/15 bg-white/5" : "border-white/5 bg-[#111] hover:border-white/10"}`}
            >
              <div className={`p-2 rounded-xl ${bg}`}>
                <Icon size={14} className={color} />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{count}</p>
                <p className="text-[11px] text-gray-500">{label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Customer grid */}
        {displayed.length === 0 ? (
          <div className="bg-[#111] border border-white/5 rounded-2xl p-12 text-center">
            <Award size={36} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">No customers found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map((customer, i) => {
              const status = classify(customer, customers);
              const cfg    = statusConfig[status];
              const Icon   = cfg.icon;
              const count  = customers.filter(c => c.userId === customer.userId).length;
              const spent  = customers.filter(c => c.userId === customer.userId).reduce((s, c) => s + c.amountPaid, 0);
              const avg    = count > 0 ? Math.round(spent / count) : 0;
              const days   = moment().diff(moment(customer.bookingDate), "days");

              return (
                <div
                  key={i}
                  className={`bg-[#111] border ${cfg.border} rounded-2xl overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200`}
                >
                  {/* Color strip */}
                  <div className={`h-1 bg-gradient-to-r ${cfg.badge}`} />

                  <div className="p-5">
                    {/* Name + badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                          <span className={`font-bold text-sm ${cfg.color}`}>
                            {(customer.name || "?")[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">{customer.name || "Guest"}</p>
                          <span className={`text-[10px] font-medium flex items-center gap-1 mt-0.5 ${cfg.color}`}>
                            <Icon size={11} /> {status}
                          </span>
                        </div>
                      </div>
                      {/* Stars */}
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, j) => (
                          <Star
                            key={j}
                            size={12}
                            className={j < Math.min(count, 5) ? "text-amber-400 fill-amber-400" : "text-gray-700"}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Contact info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs">
                        <Mail size={12} className="text-gray-600 flex-shrink-0" />
                        <span className="text-gray-400 truncate">{customer.email || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Phone size={12} className="text-gray-600 flex-shrink-0" />
                        <span className="text-gray-400">{customer.phone || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CalendarDays size={12} className="text-gray-600 flex-shrink-0" />
                        <span className="text-gray-400">
                          {moment(customer.bookingDate).format("DD MMM YYYY")}
                          <span className="text-gray-600 ml-1">({days}d ago)</span>
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-white/5">
                      {[
                        { label: "Bookings", value: count,  color: "text-lime-400"   },
                        { label: "Spent",    value: `₹${spent}`, color: "text-emerald-400" },
                        { label: "Avg",      value: `₹${avg}`,   color: "text-amber-400"  },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="text-center">
                          <p className={`text-base font-bold ${color}`}>{value}</p>
                          <p className="text-[10px] text-gray-600 mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <a
                        href={`tel:${customer.phone}`}
                        className="flex-1 text-xs text-center py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition flex items-center justify-center gap-1.5"
                      >
                        <Phone size={12} /> Call
                      </a>
                      <a
                        href={`mailto:${customer.email}`}
                        className="flex-1 text-xs text-center py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition flex items-center justify-center gap-1.5"
                      >
                        <Mail size={12} /> Email
                      </a>
                      <a
                        href={`https://wa.me/91${customer.phone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 text-xs text-center py-2 rounded-xl bg-lime-500/10 hover:bg-lime-500/20 text-lime-400 transition flex items-center justify-center gap-1.5"
                      >
                        <Zap size={12} /> WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {displayed.length > 0 && (
          <p className="text-center text-xs text-gray-600">
            Showing <span className="text-gray-400">{displayed.length}</span> of <span className="text-gray-400">{customers.length}</span> customers
          </p>
        )}
      </div>
    </div>
  );
};

export default Customers;

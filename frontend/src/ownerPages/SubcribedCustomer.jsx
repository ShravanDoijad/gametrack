import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { BookContext } from "../constexts/bookContext";
import {
  User,
  Clock,
  Calendar,
  DollarSign,
  Edit3,
  X,
  Mail,
  Phone,
  Loader2
} from "lucide-react";

const SubscribedCustomer = () => {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingSub, setEditingSub] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterMode, setFilterMode] = useState("active"); 

  const { selectedTurfId } = useContext(BookContext);

  // Fetch subscriptions
  useEffect(() => {
    const fetchSubs = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(
          `/owner/subscriptions?turfId=${selectedTurfId}`
        );
        setSubs(res.data.subscription || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load subscribed customers.");
      } finally {
        setLoading(false);
      }
    };

    if (selectedTurfId) fetchSubs();
  }, [selectedTurfId, saving]);

  const openEdit = (sub) => {
    setEditingSub({
      ...sub,
      slotStart: sub.slot?.start || "",
      slotEnd: sub.slot?.end || ""
    });
  };

  const closeEdit = () => {
    setEditingSub(null);
  };

  const handleEditChange = (field, value) => {
    setEditingSub((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!editingSub) return;

    try {
      setSaving(true);
      const payload = {
        slot: {
          start: editingSub.slotStart,
          end: editingSub.slotEnd
        }
      };

      const res = await axios.put(
        `/owner/subscriptions/${editingSub._id}`,
        payload
      );

      setSubs((prev) =>
        prev.map((s) => (s._id === editingSub._id ? res.data : s))
      );
      closeEdit();
    } catch (err) {
      console.error(err);
      alert("Failed to update subscription. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-300 bg-slate-900 rounded-lg">
        <Loader2 className="w-6 h-6 animate-spin mr-3" />
        Loading subscribed customers...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-red-400 bg-slate-900 rounded-lg flex items-center">
        <X className="w-4 h-4 mr-2" />
        {error}
      </div>
    );
  }
  const today = new Date();
  const activeSubs = subs.filter(sub => {
    const startDate = new Date(sub.startDate);
    const endDate = new Date(sub.endDate);

    return (endDate >= today && startDate <= today && sub.status === 'confirmed');
  }
  );

  const filteredSubs = filterMode === "active" ? activeSubs : subs;

  let sortedSubs = filteredSubs.sort(
    (a, b) => new Date(a.endDate) - new Date(b.endDate)
  );
  return (
    <div className="p-4 md:p-6 bg-slate-950 min-h-screen text-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">
              Subscribed Customers
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Manage your turf subscriptions and time slots
            </p>
          </div>

          {/* FILTER BUTTONS */}
          <div className="flex gap-3">
            <button
              onClick={() => setFilterMode("active")}
              className={`px-4 py-2 rounded-full text-sm transition ${filterMode === "active"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-gray-300 hover:bg-slate-700"
                }`}
            >
              Active
            </button>

            <button
              onClick={() => setFilterMode("all")}
              className={`px-4 py-2 rounded-full text-sm transition ${filterMode === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-gray-300 hover:bg-slate-700"
                }`}
            >
              All
            </button>
          </div>

          <div className="text-sm text-gray-400 bg-slate-800 px-3 py-1 rounded-full">
            {sortedSubs.length} {sortedSubs.length === 1 ? "customer" : "customers"}
          </div>
        </div>


        {sortedSubs.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
            <User className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No subscribed customers yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Customers will appear here once they subscribe to your turf
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedSubs.map((sub) => (
              <div
                key={sub._id}
                className="bg-slate-900 rounded-xl border border-slate-800 p-5 hover:border-slate-700 transition-colors"
              >
                {/* User Info Section */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">
                        {sub.userId?.fullName || "Unknown User"}
                      </h3>
                      <div className="flex flex-col text-xs text-gray-400 mt-1 space-y-1">
                        {sub.userId?.email && (
                          <div className="flex items-center">
                            <Mail className="w-3 h-3 mr-2" />
                            {sub.userId.email}
                          </div>
                        )}
                        {sub.userId?.phone && (
                          <div className="flex items-center">
                            <Phone className="w-3 h-3 mr-2" />
                            {sub.userId.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sport and Slot Info */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Sport</div>
                    <div className="text-sm font-medium text-white capitalize">
                      {sub.sport || "—"}
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Duration
                    </div>
                    <div className="text-sm font-medium text-white">
                      {sub.durationDays} days
                    </div>
                  </div>
                </div>

                {/* Time Slot */}
                <div className="bg-slate-800 rounded-lg p-3 mb-4">
                  <div className="text-xs text-gray-400 mb-2 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Time Slot
                  </div>
                  <div className="text-sm font-mono text-white">
                    {sub.slot?.start} - {sub.slot?.end}
                  </div>
                </div>

                {/* Validity Period */}
                <div className="bg-slate-800 rounded-lg p-3 mb-4">
                  <div className="text-xs text-gray-400 mb-2 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    Validity Period
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="text-white">
                      From: {new Date(sub.startDate).toLocaleDateString()}
                    </div>
                    <div className="text-white">
                      To: {new Date(sub.endDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-slate-800 rounded-lg p-3 mb-4">
                  <div className="text-xs text-gray-400 mb-2 flex items-center">
                    <DollarSign className="w-3 h-3 mr-1" />
                    Payment Details
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Amount Paid:</span>
                      <span className="text-green-400 font-semibold">
                        ₹{sub.amountPaid}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Total Amount:</span>
                      <span className="text-white font-semibold">
                        ₹{sub.totalAmount}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs mt-2 pt-2 border-t border-slate-700">
                      <span className="text-gray-400 capitalize">
                        {sub.paymentType}
                      </span>
                      <span className={`capitalize ${sub.status === 'completed' ? 'text-green-400' :
                          sub.status === 'pending' ? 'text-yellow-400' :
                            'text-red-400'
                        }`}>
                        {sub.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => openEdit(sub)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Time Slot</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* EDIT MODAL */}
        {editingSub && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-white flex items-center">
                  <Edit3 className="w-5 h-5 mr-2" />
                  Edit Time Slot
                </h2>
                <button
                  onClick={closeEdit}
                  disabled={saving}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={editingSub.slotStart}
                    onChange={(e) =>
                      handleEditChange("slotStart", e.target.value)
                    }
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={editingSub.slotEnd}
                    onChange={(e) =>
                      handleEditChange("slotEnd", e.target.value)
                    }
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={closeEdit}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg text-sm bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{saving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscribedCustomer;
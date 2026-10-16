import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Pencil, Plus, Settings2, Users } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { BookContext } from "../constexts/bookContext";

const emptyLocation = { address: "", city: "", pincode: "" };
const TurfProfile = () => {
  const { selectedTurfId } = useContext(BookContext);
  const [turf, setTurf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [subscriptionInput, setSubscriptionInput] = useState({ days: "", amount: "", description: "" });

  useEffect(() => {
    const loadTurf = async () => {
      if (!selectedTurfId) {
        setTurf(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await axios.get(`/owner/turfDetails?turfId=${selectedTurfId}`);
        setTurf(response.data.turf);
        setEditData(response.data.turf);
      } catch (error) {
        console.error("Failed to load turf settings:", error);
        toast.error("Could not load turf settings.");
      } finally {
        setLoading(false);
      }
    };
    loadTurf();
  }, [selectedTurfId]);

  const updateField = (event) => {
    const { name, value } = event.target;
    if (name.startsWith("location.")) {
      const field = name.split(".")[1];
      setEditData((current) => ({ ...current, location: { ...emptyLocation, ...current.location, [field]: value } }));
    } else {
      setEditData((current) => ({ ...current, [name]: value }));
    }
  };

  const saveTurf = async () => {
    if (!selectedTurfId || saving) return;
    setSaving(true);
    try {
      const response = await axios.put(`/owner/updateTurfProfile?turfId=${selectedTurfId}`, editData);
      setTurf(response.data.turf);
      setEditData(response.data.turf);
      setShowEditModal(false);
      toast.success("Turf settings saved.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save turf settings.");
    } finally {
      setSaving(false);
    }
  };

  const addSubscriptionPlan = async () => {
    if (!subscriptionInput.days || !subscriptionInput.amount) {
      toast.error("Enter the plan duration and amount.");
      return;
    }
    try {
      await axios.post("/api/turfs/add-subscription", { ...subscriptionInput, turfId: selectedTurfId });
      setSubscriptionInput({ days: "", amount: "", description: "" });
      setShowSubscriptionModal(false);
      toast.success("Subscription plan added.");
      const response = await axios.get(`/owner/turfDetails?turfId=${selectedTurfId}`);
      setTurf(response.data.turf);
      setEditData(response.data.turf);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not add the subscription plan.");
    }
  };

  const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);
  const Detail = ({ label, value }) => <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 break-words text-base font-semibold text-slate-900">{value || "Not set"}</p></div>;
  const chips = (items) => items?.length ? <div className="mt-3 flex flex-wrap gap-2">{items.map((item, index) => <span key={`${item}-${index}`} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">{item}</span>)}</div> : <p className="mt-2 text-sm text-slate-500">None added</p>;

  if (loading) return <div className="flex min-h-64 items-center justify-center text-sm text-slate-500" role="status">Loading settings...</div>;
  if (!turf) return <div className="m-4 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Select a turf to manage its settings.</div>;

  const fieldClass = "mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100";
  return (
    <div className="min-h-full bg-slate-50 px-4 py-5 text-slate-900 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-[1200px] space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-medium text-slate-500">Business profile</p><h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Settings</h2><p className="mt-1 text-sm text-slate-600">Manage your turf details, pricing, and operating hours.</p></div>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setShowSubscriptionModal(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Plus size={16} /> Add plan</button><button type="button" onClick={() => setShowEditModal(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#15803D] px-4 text-sm font-semibold text-white hover:bg-[#166534]"><Pencil size={16} /> Edit settings</button></div>
        </header>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            {turf.images?.[0] ? <img src={turf.images[0]} alt={`${turf.name} turf`} className="h-56 w-full object-cover md:h-full md:min-h-64" /> : <div className="flex h-56 items-center justify-center bg-slate-100 text-sm text-slate-500 md:h-full">No turf image available</div>}
            <div className="p-5 sm:p-7"><p className="text-xs font-semibold uppercase tracking-wide text-green-800">Active business</p><h3 className="mt-2 text-2xl font-bold">{turf.name}</h3><p className="mt-2 text-sm text-slate-600">{[turf.location?.address, turf.location?.city, turf.location?.pincode].filter(Boolean).join(", ") || "Add your turf location"}</p><div className="mt-6 grid grid-cols-2 gap-3"><Detail label="Day rate" value={money(turf.dayPrice)} /><Detail label="Night rate" value={money(turf.nightPrice)} /><Detail label="Opens" value={turf.openingTime} /><Detail label="Closes" value={turf.closingTime} /></div></div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="font-semibold">Pricing and details</h3><dl className="mt-4 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-slate-500">Night rate starts</dt><dd className="mt-1 font-semibold">{turf.nightPriceStart || "Not set"}</dd></div><div><dt className="text-slate-500">Availability</dt><dd className="mt-1 font-semibold">{turf.isActive === false ? "Inactive" : "Active"}</dd></div></dl><div className="mt-4 border-t border-slate-100 pt-4"><p className="text-xs font-medium text-slate-500">Sports available</p>{chips(turf.sportsAvailable)}</div></article>
          <article className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="font-semibold">Amenities and policies</h3><div className="mt-4"><p className="text-xs font-medium text-slate-500">Amenities</p>{chips(turf.amenities)}</div><div className="mt-5 border-t border-slate-100 pt-4"><p className="text-xs font-medium text-slate-500">On-site policies</p>{chips(turf.onSitePolicies)}</div></article>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"><div><h3 className="font-semibold">More owner tools</h3><p className="mt-1 text-sm text-slate-500">Customer and recurring booking tools for your turf.</p></div><div className="mt-4 grid gap-2 sm:grid-cols-3"><Link to="/owner/customers" className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 px-3 text-sm font-medium hover:bg-slate-50"><Users size={17} className="text-green-700" /> Customers <ArrowRight size={15} className="ml-auto text-slate-400" /></Link><Link to="/owner/subscription" className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 px-3 text-sm font-medium hover:bg-slate-50"><CalendarDays size={17} className="text-green-700" /> Subscriptions <ArrowRight size={15} className="ml-auto text-slate-400" /></Link><Link to="/owner/tournaments" className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 px-3 text-sm font-medium hover:bg-slate-50"><Settings2 size={17} className="text-green-700" /> Tournaments <ArrowRight size={15} className="ml-auto text-slate-400" /></Link></div></section>
      </div>

      {(showEditModal || showSubscriptionModal) && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setShowEditModal(false); setShowSubscriptionModal(false); } }}>
        {showEditModal ? <section role="dialog" aria-modal="true" aria-labelledby="edit-turf-title" className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6"><h3 id="edit-turf-title" className="text-lg font-bold">Edit turf settings</h3><p className="mt-1 text-sm text-slate-500">Keep pricing and hours accurate for your customers.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium sm:col-span-2">Turf name<input name="name" value={editData.name || ""} onChange={updateField} className={fieldClass} /></label><label className="text-sm font-medium">Day price<input type="number" min="0" name="dayPrice" value={editData.dayPrice ?? ""} onChange={updateField} className={fieldClass} /></label><label className="text-sm font-medium">Night price<input type="number" min="0" name="nightPrice" value={editData.nightPrice ?? ""} onChange={updateField} className={fieldClass} /></label><label className="text-sm font-medium">Opens<input type="time" name="openingTime" value={editData.openingTime || ""} onChange={updateField} className={fieldClass} /></label><label className="text-sm font-medium">Closes<input type="time" name="closingTime" value={editData.closingTime || ""} onChange={updateField} className={fieldClass} /></label><label className="text-sm font-medium">Night pricing starts<input type="time" name="nightPriceStart" value={editData.nightPriceStart || ""} onChange={updateField} className={fieldClass} /></label><label className="text-sm font-medium">City<input name="location.city" value={editData.location?.city || ""} onChange={updateField} className={fieldClass} /></label><label className="text-sm font-medium sm:col-span-2">Address<input name="location.address" value={editData.location?.address || ""} onChange={updateField} className={fieldClass} /></label><label className="text-sm font-medium">PIN code<input name="location.pincode" value={editData.location?.pincode || ""} onChange={updateField} className={fieldClass} /></label></div><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setShowEditModal(false)} className="min-h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700">Cancel</button><button type="button" onClick={saveTurf} disabled={saving} className="min-h-11 rounded-lg bg-[#15803D] px-4 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : "Save settings"}</button></div></section> : <section role="dialog" aria-modal="true" aria-labelledby="add-plan-title" className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6"><h3 id="add-plan-title" className="text-lg font-bold">Add subscription plan</h3><p className="mt-1 text-sm text-slate-500">Set the duration and package price.</p><div className="mt-5 space-y-3"><label className="block text-sm font-medium">Duration in days<input type="number" min="1" name="days" value={subscriptionInput.days} onChange={(event) => setSubscriptionInput((current) => ({ ...current, days: event.target.value }))} className={fieldClass} /></label><label className="block text-sm font-medium">Plan amount<input type="number" min="0" name="amount" value={subscriptionInput.amount} onChange={(event) => setSubscriptionInput((current) => ({ ...current, amount: event.target.value }))} className={fieldClass} /></label><label className="block text-sm font-medium">Description (optional)<textarea name="description" value={subscriptionInput.description} onChange={(event) => setSubscriptionInput((current) => ({ ...current, description: event.target.value }))} className={`${fieldClass} min-h-24 py-3`} /></label></div><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setShowSubscriptionModal(false)} className="min-h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700">Cancel</button><button type="button" onClick={addSubscriptionPlan} className="min-h-11 rounded-lg bg-[#15803D] px-4 text-sm font-semibold text-white">Add plan</button></div></section>}
      </div>}
    </div>
  );
};

export default TurfProfile;

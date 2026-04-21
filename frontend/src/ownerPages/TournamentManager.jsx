import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Trophy, CalendarDays, Clock, Plus, Trash2,
  Pencil, X, Check, ChevronLeft, ChevronRight,
  AlertTriangle, Loader2, CheckCircle2
} from "lucide-react";
import { BookContext } from "../constexts/bookContext";

/* ─── helpers ─── */
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const fmt = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const fmtTime = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

const isoDate = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const toMins = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

/* ─── Generate hourly slots from turf hours ─── */
const generateTimeSlots = (turf) => {
  if (!turf?.openingTime || !turf?.closingTime) return [];
  const [oh, om] = turf.openingTime.split(":").map(Number);
  const [ch, cm] = turf.closingTime.split(":").map(Number);
  let cur = oh * 60 + om;
  const end = ch * 60 + cm;
  const slots = [];
  while (cur <= end) {
    const h = Math.floor(cur / 60), m = cur % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    cur += 60;
  }
  return slots;
};

/* ─── Visual Time Range Picker ─── */
const TimeRangePicker = ({ startTime, endTime, onStartChange, onEndChange, turf }) => {
  const allSlots = generateTimeSlots(turf);
  // 0 = idle/done, 1 = picking start, 2 = picking end
  const [pickStep, setPickStep] = useState(startTime ? 0 : 1);

  const handleSlotClick = (slot) => {
    if (pickStep === 1 || pickStep === 0) {
      // Start fresh
      onStartChange(slot);
      onEndChange("");
      setPickStep(2);
    } else if (pickStep === 2) {
      if (toMins(slot) <= toMins(startTime)) {
        // Clicked before start — restart from this slot
        onStartChange(slot);
        onEndChange("");
      } else {
        onEndChange(slot);
        setPickStep(0);
      }
    }
  };

  const getState = (slot) => {
    const sm = toMins(slot);
    if (!startTime) return "idle";
    const stm = toMins(startTime);
    if (!endTime) {
      if (slot === startTime) return "start";
      if (sm > stm) return "future";
      return "idle";
    }
    const etm = toMins(endTime);
    if (slot === startTime) return "start";
    if (slot === endTime)   return "end";
    if (sm > stm && sm < etm) return "between";
    return "idle";
  };

  const stateClass = {
    idle:    "bg-[#1c1c1c] border border-white/8 text-gray-400 hover:bg-amber-500/12 hover:border-amber-500/30 hover:text-amber-300 cursor-pointer",
    future:  "bg-[#1c1c1c] border border-white/8 text-gray-400 hover:bg-amber-500/15 hover:border-amber-500/35 hover:text-amber-300 cursor-pointer",
    start:   "bg-amber-500 border border-amber-400 text-black font-bold cursor-pointer",
    end:     "bg-amber-500 border border-amber-400 text-black font-bold cursor-pointer",
    between: "bg-amber-500/22 border border-amber-500/45 text-amber-300 cursor-pointer",
  };

  const isDone = startTime && endTime;
  const duration = isDone ? Math.round((toMins(endTime) - toMins(startTime)) / 60) : 0;

  return (
    <div className="space-y-4">
      {/* Instruction pill */}
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all
        ${pickStep === 1 ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
          pickStep === 2 ? "bg-blue-500/10 border-blue-500/30 text-blue-400" :
          "bg-lime-500/10 border-lime-500/30 text-lime-400"}`}
      >
        {pickStep === 1 && (
          <><Clock size={15} className="flex-shrink-0" />
          <span>Tap a slot to set the <strong>start time</strong></span></>
        )}
        {pickStep === 2 && (
          <><Clock size={15} className="flex-shrink-0" />
          <span>Now tap the <strong>end time</strong> — must be after {fmtTime(startTime)}</span></>
        )}
        {pickStep === 0 && (
          <><CheckCircle2 size={15} className="flex-shrink-0" />
          <span><strong>{fmtTime(startTime)}</strong> to <strong>{fmtTime(endTime)}</strong>
            {" "}({duration}h block) — tap any slot to change</span></>
        )}
      </div>

      {/* Slot grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {allSlots.map((slot) => {
          const state = getState(slot);
          return (
            <button
              key={slot}
              onClick={() => handleSlotClick(slot)}
              className={`relative py-3 rounded-xl text-xs font-semibold text-center transition-all duration-150 ${stateClass[state]}`}
            >
              {fmtTime(slot)}
              {state === "start" && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] bg-amber-600 text-black px-1.5 py-0.5 rounded-full font-bold leading-none">
                  START
                </span>
              )}
              {state === "end" && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] bg-amber-600 text-black px-1.5 py-0.5 rounded-full font-bold leading-none">
                  END
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Duration summary */}
      {isDone && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="h-px flex-1 bg-white/5" />
          <span className="px-3 py-1.5 bg-[#1c1c1c] border border-white/8 rounded-lg whitespace-nowrap">
            {duration} hour{duration !== 1 ? "s" : ""} blocked · {fmtTime(startTime)} → {fmtTime(endTime)}
          </span>
          <div className="h-px flex-1 bg-white/5" />
        </div>
      )}

      {/* No turf warning */}
      {!turf?.openingTime && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-3">
          <AlertTriangle size={13} />
          Turf opening/closing time not configured. Go to Turf Profile first.
        </div>
      )}
    </div>
  );
};

/* ─── Mini Calendar ─── */
const MiniCalendar = ({ selected, onToggle, year, month, onPrev, onNext }) => {
  const firstDay = new Date(year, month, 1).getDay();
  const days = daysInMonth(year, month);
  const monthLabel = new Date(year, month).toLocaleString("default", { month: "long", year: "numeric" });
  const cells = Array(firstDay).fill(null).concat(Array.from({ length: days }, (_, i) => i + 1));

  return (
    <div className="bg-[#111] border border-white/5 rounded-2xl p-4 select-none">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrev} className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-white">{monthLabel}</span>
        <button onClick={onNext} className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} className="text-center text-[10px] text-gray-600 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateObj = new Date(year, month, day);
          const dateStr = isoDate(dateObj);
          const isPast = dateObj < TODAY;
          const isSelected = selected.includes(dateStr);

          return (
            <button
              key={i}
              disabled={isPast}
              onClick={() => !isPast && onToggle(dateStr)}
              className={`
                w-full aspect-square rounded-xl text-xs font-medium flex items-center justify-center transition-all
                ${isPast ? "text-gray-700 cursor-not-allowed" :
                  isSelected ? "bg-amber-500 text-black font-bold shadow-md shadow-amber-500/25 scale-105" :
                  "text-gray-300 hover:bg-white/10"}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
          <div className="w-3 h-3 rounded-md bg-amber-500" /> Selected
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
          <div className="w-3 h-3 rounded-md bg-white/10" /> Available
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
          <div className="w-3 h-3 rounded-md bg-[#1c1c1c]" /> Past
        </div>
      </div>
    </div>
  );
};

/* ─── Step indicator ─── */
const StepBar = ({ step }) => {
  const steps = [
    { label: "Name", desc: "Tournament name" },
    { label: "Time", desc: "Block time range" },
    { label: "Dates", desc: "Select dates" },
  ];
  return (
    <div className="flex items-center">
      {steps.map((s, i) => (
        <React.Fragment key={s.label}>
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all
              ${i < step ? "bg-lime-500 text-black" :
                i === step ? "bg-amber-500 text-black" :
                "bg-white/5 text-gray-600 border border-white/10"}`}
            >
              {i < step ? <Check size={13} /> : i + 1}
            </div>
            <div className="hidden sm:block min-w-0">
              <p className={`text-xs font-semibold leading-none ${i === step ? "text-white" : i < step ? "text-lime-400" : "text-gray-600"}`}>
                {s.label}
              </p>
              <p className="text-[10px] text-gray-700 mt-0.5 truncate">{s.desc}</p>
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px flex-1 mx-2 sm:mx-3 transition-all ${i < step ? "bg-lime-500/40" : "bg-white/8"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

/* ─── Main Component ─── */
const TournamentManager = () => {
  const { selectedTurfId, turfs } = useContext(BookContext);
  const turf = turfs?.find(t => t._id === selectedTurfId);

  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [formStep, setFormStep]       = useState(0);

  const [name, setName]                   = useState("");
  const [selectedDates, setSelectedDates] = useState([]);
  const [startTime, setStartTime]         = useState("");
  const [endTime, setEndTime]             = useState("");
  const [calYear, setCalYear]             = useState(new Date().getFullYear());
  const [calMonth, setCalMonth]           = useState(new Date().getMonth());

  const fetchTournaments = async () => {
    if (!selectedTurfId) return;
    try { setLoading(true); const res = await axios.get(`/owner/tournaments?turfId=${selectedTurfId}`); setTournaments(res.data.tournaments || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchTournaments(); }, [selectedTurfId]);

  const toggleDate = (d) =>
    setSelectedDates(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());

  const resetForm = () => {
    setName(""); setSelectedDates([]); setStartTime(""); setEndTime("");
    setEditingId(null); setShowForm(false); setFormStep(0);
  };

  const startEdit = (t) => {
    setEditingId(t._id); setName(t.name); setSelectedDates([...t.dates]);
    setStartTime(t.startTime); setEndTime(t.endTime); setFormStep(0); setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const canNext = () => {
    if (formStep === 0) return name.trim().length > 0;
    if (formStep === 1) return startTime && endTime && toMins(endTime) > toMins(startTime);
    return true;
  };

  const handleSave = async () => {
    if (!name.trim() || !startTime || !endTime || selectedDates.length === 0) { toast.error("Please complete all steps"); return; }
    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`/owner/tournament/${editingId}`, { turfId: selectedTurfId, name, dates: selectedDates, startTime, endTime });
        toast.success("Tournament updated!");
      } else {
        await axios.post("/owner/tournament", { turfId: selectedTurfId, name, dates: selectedDates, startTime, endTime });
        toast.success("Tournament created! Slots blocked.");
      }
      resetForm(); fetchTournaments();
    } catch (e) { toast.error(e.response?.data?.message || "Something went wrong"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/owner/tournament/${id}?turfId=${selectedTurfId}`);
      toast.success("Tournament removed, slots unblocked");
      setDeleteModal(null); fetchTournaments();
    } catch { toast.error("Failed to delete"); }
  };

  const prevMonth = () => calMonth === 0 ? (setCalMonth(11), setCalYear(y => y - 1)) : setCalMonth(m => m - 1);
  const nextMonth = () => calMonth === 11 ? (setCalMonth(0), setCalYear(y => y + 1)) : setCalMonth(m => m + 1);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-5 font-sora">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Trophy size={20} className="text-amber-400" /> Tournament Manager
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Block turf slots for tournaments across multiple dates</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-sm font-semibold transition-all shadow-lg shadow-amber-500/20"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">New Tournament</span>
              <span className="sm:hidden">New</span>
            </button>
          )}
        </div>

        {/* ── Multi-step Form ── */}
        {showForm && (
          <div className="bg-[#111] border border-amber-500/20 rounded-2xl overflow-hidden">

            {/* Form header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                <Trophy size={14} className="text-amber-400" />
                {editingId ? "Edit Tournament" : "Create Tournament"}
              </span>
              <button onClick={resetForm} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition">
                <X size={16} />
              </button>
            </div>

            {/* Step bar */}
            <div className="px-5 py-4 border-b border-white/5">
              <StepBar step={formStep} />
            </div>

            <div className="p-5 space-y-5">

              {/* Step 0 — Name */}
              {formStep === 0 && (
                <div>
                  <label className="text-[11px] text-gray-500 uppercase tracking-wider mb-2 block">
                    Tournament name
                  </label>
                  <input
                    autoFocus
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && canNext() && setFormStep(1)}
                    placeholder="e.g. Summer Football Championship"
                    className="w-full bg-[#1a1a1a] border border-white/10 text-white text-base rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/40 placeholder:text-gray-600"
                  />
                  <p className="text-[11px] text-gray-700 mt-1.5">Press Enter or tap Next to continue</p>
                </div>
              )}

              {/* Step 1 — Time picker */}
              {formStep === 1 && (
                <div>
                  <label className="text-[11px] text-gray-500 uppercase tracking-wider mb-3 block">
                    When does <span className="text-amber-400">"{name}"</span> run? Tap start then end
                  </label>
                  <TimeRangePicker
                    startTime={startTime}
                    endTime={endTime}
                    onStartChange={setStartTime}
                    onEndChange={setEndTime}
                    turf={turf}
                  />
                </div>
              )}

              {/* Step 2 — Dates */}
              {formStep === 2 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-gray-500 uppercase tracking-wider">
                      Tap dates — {selectedDates.length} selected
                    </label>
                    {selectedDates.length > 0 && (
                      <button onClick={() => setSelectedDates([])} className="text-[11px] text-gray-600 hover:text-red-400 transition">
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* Time reminder */}
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-500/8 border border-amber-500/15 rounded-xl text-xs text-amber-400/80">
                    <Clock size={12} className="flex-shrink-0" />
                    Blocking <strong className="text-amber-400">{fmtTime(startTime)} – {fmtTime(endTime)}</strong> on all selected dates
                  </div>

                  <MiniCalendar
                    selected={selectedDates}
                    onToggle={toggleDate}
                    year={calYear}
                    month={calMonth}
                    onPrev={prevMonth}
                    onNext={nextMonth}
                  />

                  {selectedDates.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedDates.map(d => (
                        <span key={d} className="flex items-center gap-1.5 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1.5 rounded-lg">
                          <CalendarDays size={10} />
                          {fmt(d)}
                          <button onClick={() => toggleDate(d)} className="hover:text-white transition">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Nav */}
              <div className="flex gap-3 pt-2 border-t border-white/5">
                {formStep > 0 && (
                  <button
                    onClick={() => setFormStep(s => s - 1)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm transition"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                )}
                {formStep < 2 ? (
                  <button
                    onClick={() => setFormStep(s => s + 1)}
                    disabled={!canNext()}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-sm font-semibold transition-all disabled:opacity-35 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={saving || selectedDates.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-sm font-semibold transition-all disabled:opacity-35"
                  >
                    {saving
                      ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                      : <><Check size={14} /> {editingId ? "Save Changes" : "Create & Block Slots"}</>
                    }
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info banner */}
        <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/10 rounded-xl p-3.5">
          <AlertTriangle size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-400/70 leading-relaxed">
            Blocked slots show as <strong>unavailable</strong> to users. Existing bookings are <strong>not</strong> auto-cancelled — handle them manually if needed.
          </p>
        </div>

        {/* Tournament list */}
        <div>
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-3">
            {loading ? "Loading…" : `${tournaments.length} tournament${tournaments.length !== 1 ? "s" : ""}`}
          </p>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-amber-400" size={28} /></div>
          ) : tournaments.length === 0 ? (
            <div className="bg-[#111] border border-white/5 rounded-2xl p-10 text-center">
              <Trophy size={30} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No tournaments yet</p>
              <p className="text-gray-700 text-xs mt-1">Create one to block slots across multiple dates</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tournaments.map(t => (
                <div key={t._id} className="bg-[#111] border border-white/5 hover:border-amber-500/20 rounded-2xl p-4 sm:p-5 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2.5">
                        <span className="font-semibold text-white">{t.name}</span>
                        <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/15 px-2.5 py-1 rounded-lg">
                          <Clock size={10} /> {fmtTime(t.startTime)} – {fmtTime(t.endTime)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {t.dates.map(d => (
                          <span key={d} className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border
                            ${new Date(d) < TODAY ? "text-gray-700 border-white/5" : "text-amber-400/80 border-amber-400/15 bg-amber-400/5"}`}>
                            <CalendarDays size={9} />
                            {fmt(d)}
                            {new Date(d) < TODAY && <span className="text-gray-700 ml-0.5">(past)</span>}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-700 mt-2">
                        {t.dates.length} date{t.dates.length !== 1 ? "s" : ""} · {t.dates.filter(d => new Date(d) >= TODAY).length} upcoming
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => startEdit(t)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteModal(t)} className="p-2 rounded-xl bg-red-400/8 hover:bg-red-400/20 text-red-400 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <Trash2 className="mx-auto text-red-400 h-9 w-9 mb-3" />
            <h2 className="text-white text-base font-semibold text-center">Delete tournament?</h2>
            <p className="text-white/70 text-sm text-center mt-1 font-medium">{deleteModal.name}</p>
            <p className="text-gray-600 text-xs text-center mt-1 mb-5">
              Slots across {deleteModal.dates.length} date{deleteModal.dates.length !== 1 ? "s" : ""} will be unblocked.
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteModal._id)} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium transition">
                Yes, delete
              </button>
              <button onClick={() => setDeleteModal(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-2.5 rounded-xl text-sm transition">
                Keep it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentManager;

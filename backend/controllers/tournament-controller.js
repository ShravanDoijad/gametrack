// tournament-controller.js
// Add to your backend routes: 
//   POST   /owner/tournament        → createTournament
//   PUT    /owner/tournament/:id    → updateTournament
//   DELETE /owner/tournament/:id    → deleteTournament
//   GET    /owner/tournaments       → getTournaments

const Turf        = require("../models/turf-model");
const Tournament  = require("../models/tournament-model");

/* ── helpers ── */

// Block slots on turf.bookedSlots for all given dates + time range
const blockSlotsOnTurf = async (turf, dates, startTime, endTime) => {
  for (const dateStr of dates) {
    let dayEntry = turf.bookedSlots.find(d => d.date === dateStr);
    if (dayEntry) {
      // Check if this exact unavailable slot already exists (avoid duplicates)
      const alreadyBlocked = dayEntry.slots.some(
        s => s.start === startTime && s.end === endTime && dayEntry.status === "unavailable"
      );
      if (!alreadyBlocked) {
        dayEntry.slots.push({ start: startTime, end: endTime });
      }
    } else {
      turf.bookedSlots.push({
        date: dateStr,
        slots: [{ start: startTime, end: endTime }],
        status: "unavailable",
      });
    }
  }
};

// Remove specific tournament slots from turf.bookedSlots
const unblockSlotsOnTurf = async (turf, dates, startTime, endTime) => {
  for (const dateStr of dates) {
    const dayEntry = turf.bookedSlots.find(d => d.date === dateStr);
    if (!dayEntry) continue;

    // Remove the slot that matches this tournament's time
    dayEntry.slots = dayEntry.slots.filter(
      s => !(s.start === startTime && s.end === endTime)
    );

    // If no slots left for this day (and it was unavailable), remove the day entry
    if (dayEntry.slots.length === 0 && dayEntry.status === "unavailable") {
      turf.bookedSlots = turf.bookedSlots.filter(d => d.date !== dateStr);
    }
  }
};

/* ── CREATE ── */
const createTournament = async (req, res) => {
  try {
    const { turfId, name, dates, startTime, endTime } = req.body;

    if (!turfId || !name?.trim() || !dates?.length || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const turf = await Turf.findById(turfId);
    if (!turf) return res.status(404).json({ success: false, message: "Turf not found" });

    // Block slots on turf
    await blockSlotsOnTurf(turf, dates, startTime, endTime);
    await turf.save();

    // Save tournament record
    const tournament = await Tournament.create({
      turfId,
      name: name.trim(),
      dates,
      startTime,
      endTime,
    });

    return res.status(201).json({ success: true, tournament });
  } catch (error) {
    console.error("createTournament error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/* ── UPDATE ── */
const updateTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const { turfId, name, dates, startTime, endTime } = req.body;

    const existing = await Tournament.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: "Tournament not found" });

    const turf = await Turf.findById(turfId);
    if (!turf) return res.status(404).json({ success: false, message: "Turf not found" });

    // 1. Unblock OLD slots
    await unblockSlotsOnTurf(turf, existing.dates, existing.startTime, existing.endTime);

    // 2. Block NEW slots
    await blockSlotsOnTurf(turf, dates, startTime, endTime);
    await turf.save();

    // 3. Update tournament record
    existing.name      = name.trim();
    existing.dates     = dates;
    existing.startTime = startTime;
    existing.endTime   = endTime;
    await existing.save();

    return res.status(200).json({ success: true, tournament: existing });
  } catch (error) {
    console.error("updateTournament error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/* ── DELETE ── */
const deleteTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const { turfId } = req.query;

    const tournament = await Tournament.findById(id);
    if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found" });

    const turf = await Turf.findById(turfId);
    if (!turf) return res.status(404).json({ success: false, message: "Turf not found" });

    // Unblock slots
    await unblockSlotsOnTurf(turf, tournament.dates, tournament.startTime, tournament.endTime);
    await turf.save();

    await Tournament.findByIdAndDelete(id);

    return res.status(200).json({ success: true, message: "Tournament deleted and slots unblocked" });
  } catch (error) {
    console.error("deleteTournament error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/* ── GET ALL for a turf ── */
const getTournaments = async (req, res) => {
  try {
    const { turfId } = req.query;
    if (!turfId) return res.status(400).json({ success: false, message: "turfId is required" });

    const tournaments = await Tournament.find({ turfId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, tournaments });
  } catch (error) {
    console.error("getTournaments error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { createTournament, updateTournament, deleteTournament, getTournaments };

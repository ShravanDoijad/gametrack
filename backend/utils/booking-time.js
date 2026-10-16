const { toMinutes } = require("./booking-pricing");

const parseBookingDateTime = (dateValue, timeValue) => {
  const datePart = dateValue instanceof Date
    ? dateValue.toISOString().slice(0, 10)
    : String(dateValue || "").slice(0, 10);
  const minuteOfDay = toMinutes(timeValue);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart) || minuteOfDay === null) return null;
  const [year, month, day] = datePart.split("-").map(Number);
  const dateCheck = new Date(Date.UTC(year, month - 1, day));
  if (dateCheck.getUTCFullYear() !== year || dateCheck.getUTCMonth() !== month - 1 || dateCheck.getUTCDate() !== day) return null;
  // Turf slot clocks use India local time; booking dates are persisted at UTC midnight.
  return new Date(Date.UTC(year, month - 1, day, Math.floor(minuteOfDay / 60), minuteOfDay % 60) - 330 * 60 * 1000);
};

const getBookingInterval = (dateValue, slot) => {
  const start = parseBookingDateTime(dateValue, slot?.start);
  const end = parseBookingDateTime(dateValue, slot?.end);
  if (!start || !end) return null;
  if (end <= start) end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

const isBookingUpcoming = (booking, now = new Date()) => {
  if (!booking || booking.status === "cancelled" || !Array.isArray(booking.slots)) return false;
  const endTimes = booking.slots.map((slot) => getBookingInterval(booking.date, slot)?.end).filter(Boolean);
  return endTimes.length > 0 && endTimes.some((end) => end > now);
};

const getBookingEnd = (booking) => {
  if (!booking || !Array.isArray(booking.slots)) return null;
  const ends = booking.slots
    .map((slot) => getBookingInterval(booking.date, slot)?.end)
    .filter(Boolean);
  return ends.length ? new Date(Math.max(...ends.map((date) => date.getTime()))) : null;
};

const isReviewEligible = (booking, now = new Date()) => {
  if (!booking || booking.status !== "confirmed" || booking.isReviewed) return false;
  const end = getBookingEnd(booking);
  return Boolean(end && end <= now);
};

const isCancellationEligible = ({ createdAt, date, slot, now = new Date() }) => {
  const created = new Date(createdAt);
  const interval = getBookingInterval(date, slot);
  if (!Number.isFinite(created.getTime()) || !interval) return false;
  const elapsed = now.getTime() - created.getTime();
  const untilStart = interval.start.getTime() - now.getTime();
  return elapsed >= 0 && elapsed <= 24 * 60 * 60 * 1000 && untilStart > 24 * 60 * 60 * 1000;
};

module.exports = { parseBookingDateTime, getBookingInterval, isBookingUpcoming, getBookingEnd, isReviewEligible, isCancellationEligible };

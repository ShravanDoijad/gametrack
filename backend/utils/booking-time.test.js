const test = require("node:test");
const assert = require("node:assert/strict");
const { parseBookingDateTime, getBookingInterval, isBookingUpcoming, isCancellationEligible } = require("./booking-time");

test("parses stored 24-hour time on the booking date", () => {
  const actual = parseBookingDateTime("2026-10-15", "18:30");
  assert.equal(actual.toISOString(), "2026-10-15T13:00:00.000Z");
});

test("moves an end time before the start time to the next date", () => {
  const interval = getBookingInterval("2026-10-15", { start: "23:30", end: "00:30" });
  assert.equal(interval.end.toISOString(), "2026-10-15T19:00:00.000Z");
  assert.equal(interval.end.toISOString(), "2026-10-15T19:00:00.000Z");
});

test("rejects malformed booking dates and times", () => {
  assert.equal(parseBookingDateTime("2026-02-30", "12:00"), null);
  assert.equal(parseBookingDateTime("2026-10-15", "25:00"), null);
});

test("classifies a booking by its end time and ignores cancelled bookings", () => {
  const now = new Date("2026-10-15T14:00:00.000Z");
  assert.equal(isBookingUpcoming({ date: "2026-10-15", slots: [{ start: "18:00", end: "20:00" }] }, now), true);
  assert.equal(isBookingUpcoming({ date: "2026-10-15", slots: [{ start: "18:00", end: "20:00" }] }, new Date("2026-10-15T15:00:00Z")), false);
  assert.equal(isBookingUpcoming({ status: "cancelled", date: "2026-10-15", slots: [{ start: "18:00", end: "20:00" }] }, now), false);
});

test("enforces the booking age and 24-hour-before-slot cancellation window", () => {
  const now = new Date("2026-10-15T10:00:00.000Z");
  assert.equal(isCancellationEligible({ createdAt: "2026-10-15T09:00:00Z", date: "2026-10-17", slot: { start: "18:00", end: "19:00" }, now }), true);
  assert.equal(isCancellationEligible({ createdAt: "2026-10-14T08:00:00Z", date: "2026-10-17", slot: { start: "18:00", end: "19:00" }, now }), false);
  assert.equal(isCancellationEligible({ createdAt: "2026-10-15T09:00:00Z", date: "2026-10-16", slot: { start: "15:00", end: "16:00" }, now }), false);
});

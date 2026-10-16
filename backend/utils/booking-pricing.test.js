const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateBookingTotal, calculateAdvance } = require("./booking-pricing");

const rates = { dayPrice: 1600, nightPrice: 2200, nightPriceStart: "20:00" };

test("one hour booking total and advance are calculated once", () => {
  const total = calculateBookingTotal({ ...rates, start: "18:00", end: "19:00" });
  assert.equal(total, 1600);
  assert.equal(calculateAdvance(total), 320);
});

test("multi-hour booking advance is 20 percent of the complete total", () => {
  const total = calculateBookingTotal({ ...rates, start: "18:00", end: "21:00" });
  assert.equal(total, 5400);
  assert.equal(calculateAdvance(total), 1080);
});

test("a booking crossing the day/night cutoff applies each rate to its interval", () => {
  const total = calculateBookingTotal({ ...rates, start: "19:30", end: "20:30" });
  assert.equal(total, 1900);
});

test("pricing accounts for minutes and crosses midnight", () => {
  const total = calculateBookingTotal({
    dayPrice: 1200, nightPrice: 1800, nightPriceStart: "20:00",
    start: "23:30", end: "00:30",
  });
  assert.equal(total, 1500);
});

test("uses the day rate when no night-rate start time is configured", () => {
  assert.equal(calculateBookingTotal({
    dayPrice: 1200, nightPrice: 1800, start: "21:00", end: "22:00",
  }), 1200);
});

test("invalid time and price inputs are rejected", () => {
  assert.equal(calculateBookingTotal({ ...rates, start: "25:00", end: "26:00" }), null);
  assert.equal(calculateAdvance(-1), null);
});

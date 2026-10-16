const toMinutes = (time) => {
  if (typeof time !== "string" || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
};

const roundMoney = (amount) => Math.round((amount + Number.EPSILON) * 100) / 100;

const calculateBookingTotal = ({ start, end, dayPrice, nightPrice, nightPriceStart }) => {
  const startMinute = toMinutes(start);
  let endMinute = toMinutes(end);
  const cutoff = nightPriceStart ? toMinutes(nightPriceStart) : null;
  const dayRate = Number(dayPrice);
  const nightRate = Number(nightPrice);

  if (startMinute === null || endMinute === null || (nightPriceStart && cutoff === null) ||
      !Number.isFinite(dayRate) || dayRate < 0 ||
      !Number.isFinite(nightRate) || nightRate < 0) return null;
  if (endMinute <= startMinute) endMinute += 24 * 60;
  const duration = endMinute - startMinute;
  if (duration <= 0 || duration > 24 * 60) return null;

  let total = 0;
  for (let minute = startMinute; minute < endMinute; minute += 1) {
    const minuteOfDay = minute % (24 * 60);
    const rate = cutoff !== null && minuteOfDay >= cutoff ? nightRate : dayRate;
    total += rate / 60;
  }
  return roundMoney(total);
};

const calculateAdvance = (total, percent = 20) => {
  const amount = Number(total);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return roundMoney(amount * percent / 100);
};

module.exports = { calculateBookingTotal, calculateAdvance, toMinutes };

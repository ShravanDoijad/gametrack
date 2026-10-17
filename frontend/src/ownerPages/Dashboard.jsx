
import { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Plus,
  IndianRupee,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { BookContext } from "../constexts/bookContext";

const money = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const dateKey = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const timeLabel = (value) => {
  if (!value) return "Time not set";

  // Handles time values such as "09:00" as well as date strings.
  if (/^\d{1,2}:\d{2}$/.test(String(value))) {
    const [hours, minutes] = String(value).split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const isCancelled = (booking) =>
  String(booking.status || "").toLowerCase() === "cancelled";

export default function Dashboard() {
  const {
    selectedTurfId,
    turfs = [],
    bookings = [],
    ownerBookingsLoading,
  } = useContext(BookContext);

  const todayKey = dateKey(new Date());

  const turf = turfs.find(
    (item) => String(item._id) === String(selectedTurfId)
  );

  const turfBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        const bookingTurfId =
          booking.turf?._id ?? booking.turfId ?? booking.turf;

        return (
          !selectedTurfId ||
          !bookingTurfId ||
          String(bookingTurfId) === String(selectedTurfId)
        );
      }),
    [bookings, selectedTurfId]
  );

  const todayBookings = useMemo(
    () =>
      turfBookings
        .filter(
          (booking) =>
            dateKey(booking.date) === todayKey &&
            !isCancelled(booking)
        )
        .sort((a, b) =>
          String(a.startTime || "").localeCompare(
            String(b.startTime || "")
          )
        ),
    [turfBookings, todayKey]
  );

  const collectedToday = todayBookings.reduce(
    (sum, booking) =>
      sum + (Number(booking.amountPaid) || 0),
    0
  );

  const pendingToday = todayBookings.reduce((sum, booking) => {
    const total =
      Number(booking.totalAmount ?? booking.amount) || 0;
    const paid = Number(booking.amountPaid) || 0;

    return sum + Math.max(total - paid, 0);
  }, 0);

  const chartData = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (6 - index));

        const key = dateKey(date);

        const dayBookings = turfBookings.filter(
          (booking) =>
            dateKey(booking.date) === key &&
            !isCancelled(booking)
        );

        return {
          day: date.toLocaleDateString("en-IN", {
            weekday: "short",
          }),
          bookings: dayBookings.length,
          revenue: dayBookings.reduce(
            (sum, booking) =>
              sum + (Number(booking.amountPaid) || 0),
            0
          ),
        };
      }),
    [turfBookings]
  );

  const totalBookings = turfBookings.filter(
    (booking) => !isCancelled(booking)
  ).length;

  const totalCollected = turfBookings.reduce(
    (sum, booking) =>
      sum +
      (!isCancelled(booking)
        ? Number(booking.amountPaid) || 0
        : 0),
    0
  );

  const tooltipStyle = {
    backgroundColor: "#080808",
    border: "1px solid #262626",
    borderRadius: "8px",
    color: "#f5f5f5",
  };

  return (
    <main className="min-h-screen bg-black p-4 text-white sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">

        {/* Overview */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Overview
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              {turf?.name || "Your turf"}
            </p>
          </div>

          <Link
            to="/owner/time-slots"
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-sm font-medium transition hover:bg-neutral-900"
          >
            <Plus size={17} />
            Manual Booking
          </Link>
        </header>

        {/* Summary Cards */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-xl border border-neutral-800 bg-black p-4">
            <div className="mb-3 flex items-center gap-2 text-sm text-neutral-300">
              <IndianRupee size={16} className="text-blue-500" />
              Revenue
            </div>
            <p className="text-2xl font-semibold">
              {money(totalCollected)}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Total collected
            </p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-black p-4">
            <div className="mb-3 flex items-center gap-2 text-sm text-neutral-300">
              <CalendarDays size={16} className="text-blue-500" />
              Bookings
            </div>
            <p className="text-2xl font-semibold">
              {totalBookings}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Total bookings
            </p>
          </div>
        </section>

        {/* Revenue Trend */}
        <section className="rounded-xl border border-neutral-800 bg-black p-4 sm:p-5">
          <div className="mb-5">
            <h2 className="font-semibold">Revenue trend</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Collected payments over the last 7 days
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 8, left: 4, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="day"
                  stroke="#a3a3a3"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  width={58}
                  stroke="#a3a3a3"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) =>
                    value >= 1000
                      ? `₹${(value / 1000).toFixed(1)}k`
                      : `₹${value}`
                  }
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [money(value), "Revenue"]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{
                    fill: "#2563eb",
                    stroke: "#404040",
                    strokeWidth: 2,
                    r: 4,
                  }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Collected and Pending */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-xl border border-neutral-800 bg-black p-4">
            <p className="text-sm text-neutral-400">
              Collected today
            </p>
            <p className="mt-2 text-xl font-semibold">
              {money(collectedToday)}
            </p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-black p-4">
            <p className="text-sm text-neutral-400">
              Money pending today
            </p>
            <p className="mt-2 text-xl font-semibold">
              {money(pendingToday)}
            </p>
          </div>
        </section>

        {/* Today's Schedule */}
        <section className="rounded-xl border border-neutral-800 bg-black p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Today's Schedule</h2>
              <p className="mt-1 text-sm text-neutral-500">
                {todayBookings.length} bookings today
              </p>
            </div>

            <Link
              to="/owner/turfTodaysbookings"
              className="text-sm text-blue-500 hover:text-blue-400"
            >
              View all
            </Link>
          </div>

          {ownerBookingsLoading ? (
            <p className="py-8 text-center text-sm text-neutral-400">
              Loading schedule...
            </p>
          ) : todayBookings.length === 0 ? (
            <div className="py-10 text-center">
              <CalendarDays
                size={30}
                className="mx-auto mb-3 text-neutral-600"
              />
              <p className="text-sm text-neutral-300">
                No bookings for today
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {todayBookings.slice(0, 8).map((booking, index) => (
                <div
                  key={booking._id || booking.id || index}
                  className="flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-lg border border-neutral-800 p-2.5 text-blue-500">
                      <Clock size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {booking.user?.name ||
                          booking.userName ||
                          booking.customerName ||
                          "Customer"}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {timeLabel(booking.startTime)}
                        {booking.endTime
                          ? ` – ${timeLabel(booking.endTime)}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium">
                      {money(
                        booking.totalAmount ?? booking.amount ?? 0
                      )}
                    </p>
                    <p className="mt-1 text-xs capitalize text-neutral-400">
                      {booking.status || "Booked"}
                    </p>
                  </div>
                </div>
              ))}

              {todayBookings.length > 8 && (
                <Link
                  to="/owner/turfTodaysbookings"
                  className="block pt-4 text-center text-sm text-blue-500"
                >
                  View {todayBookings.length - 8} more bookings
                </Link>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}


import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { format, isToday, parseISO, parse } from "date-fns";
import { BookContext } from "../constexts/bookContext";
import {
  IndianRupee,
  CalendarX,
  BadgeCheck,
  Loader2,
  Repeat,
} from "lucide-react";

const formatTime = (time) => {
  if (!time) return "—";

  try {
    return format(parse(time, "HH:mm", new Date()), "hh:mm a");
  } catch {
    return time;
  }
};

const money = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const statusColors = {
  confirmed: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  pending: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  cancelled: "text-red-400 bg-red-500/10 border-red-500/20",
};

const TodaysBookings = () => {
  const { bookings = [], selectedTurfId } = useContext(BookContext);

  const [loading, setLoading] = useState(true);
  const [subsLoading, setSubsLoading] = useState(true);
  const [todayBookings, setToday] = useState([]);
  const [todaySubs, setTodaySubs] = useState([]);

  useEffect(() => {
    const fetchSubs = async () => {
      try {
        setSubsLoading(true);

        const res = await axios.get(
          `/owner/subscriptions?turfId=${selectedTurfId}`
        );

        const allSubs = res.data.subscription || [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeToday = allSubs.filter((sub) => {
          const startDate = new Date(sub.startDate);
          startDate.setHours(0, 0, 0, 0);

          const endDate = new Date(sub.endDate);
          endDate.setHours(0, 0, 0, 0);

          return (
            startDate <= today &&
            endDate >= today &&
            sub.status === "confirmed"
          );
        });

        setTodaySubs(activeToday);
      } catch (error) {
        console.error("Failed to load subscriptions", error);
        setTodaySubs([]);
      } finally {
        setSubsLoading(false);
      }
    };

    if (selectedTurfId) {
      fetchSubs();
    } else {
      setTodaySubs([]);
      setSubsLoading(false);
    }
  }, [selectedTurfId]);

  useEffect(() => {
    const filtered = bookings.filter((booking) => {
      if (!booking.date) return false;

      try {
        return isToday(parseISO(booking.date));
      } catch {
        return false;
      }
    });

    setToday(filtered);
    setLoading(false);
  }, [bookings]);

  const totalToday = todayBookings.reduce(
    (sum, booking) => sum + (Number(booking.amountPaid) || 0),
    0
  );

  const totalCount = todayBookings.length + todaySubs.length;

  const confirmed =
    todayBookings.filter((booking) => booking.status === "confirmed")
      .length + todaySubs.length;

  const renderTable = (data, isSub = false) => (
    <div className="w-full overflow-x-auto rounded-xl border border-neutral-800 bg-black">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-neutral-800 bg-neutral-950 text-xs uppercase tracking-wider text-neutral-400">
            <th className="whitespace-nowrap px-4 py-3 font-medium">
              Time Slot
            </th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">
              Customer
            </th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">
              Phone & ID
            </th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">
              {isSub ? "Paid" : "Advance"}
            </th>

            {!isSub && (
              <th className="whitespace-nowrap px-4 py-3 font-medium">
                Total / Balance
              </th>
            )}

            {isSub && (
              <th className="whitespace-nowrap px-4 py-3 font-medium">
                Date Range
              </th>
            )}

            <th className="whitespace-nowrap px-4 py-3 font-medium">
              Payment
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
              Status
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-neutral-800 text-sm">
          {data.map((booking) => {
            const name =
              booking.userId?.fullName ||
              booking.userId?.fullname ||
              booking.fullname ||
              "Guest";

            const phone = booking.userId?.phone || booking.phone || "—";
            const status = String(
              booking.status || "confirmed"
            ).toLowerCase();

            const slots = isSub
              ? booking.slot
                ? [booking.slot]
                : []
              : booking.originalSlots || booking.slots || [];

            const slotText =
              slots.length > 0
                ? `${formatTime(slots[0].start)} - ${formatTime(
                    slots[slots.length - 1].end
                  )}`
                : "—";

            const amountPaid = Number(booking.amountPaid) || 0;
            const slotFees = Number(booking.slotFees) || 0;

            return (
              <tr
                key={booking._id}
                className="transition-colors hover:bg-neutral-900/60"
              >
                <td className="whitespace-nowrap px-4 py-3 font-medium text-blue-400">
                  {slotText}
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-white">
                  <div className="flex items-center gap-2">
                    {name}
                    {isSub && (
                      <Repeat
                        size={13}
                        className="text-blue-400"
                        title="Subscription"
                      />
                    )}
                  </div>
                </td>

                <td className="whitespace-nowrap px-4 py-3">
                  <div className="text-neutral-300">{phone}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-neutral-500">
                    ID: {booking._id ? `...${booking._id.slice(-6)}` : "—"}
                  </div>
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-neutral-300">
                  {money(amountPaid)}
                </td>

                {!isSub && (
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="text-neutral-300">
                      {money(slotFees)}
                    </div>
                    <div className="mt-0.5 text-[10px] text-red-400">
                      Due: {money(Math.max(0, slotFees - amountPaid))}
                    </div>
                  </td>
                )}

                {isSub && (
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-400">
                    {new Date(booking.startDate).toLocaleDateString()}
                    <br />
                    <span className="text-neutral-600">to </span>
                    {new Date(booking.endDate).toLocaleDateString()}
                  </td>
                )}

                <td className="whitespace-nowrap px-4 py-3 text-neutral-400">
                  {booking.paymentType === "Manual" ||
                  booking.paymentType === "full"
                    ? "Manual/Cash"
                    : "Online"}
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <span
                    className={`inline-block rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                      statusColors[status] ||
                      "border-neutral-700 bg-neutral-900 text-neutral-300"
                    }`}
                  >
                    {status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  if (loading || subsLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-black">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black p-4 text-white sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            Today's Bookings
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Manage today's bookings and active subscriptions.
          </p>
        </header>

        {/* Summary Cards */}
        <section className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Total Visits Today",
              value: totalCount,
              icon: CalendarX,
              color: "text-blue-400",
              bg: "bg-blue-500/10",
            },
            {
              label: "Confirmed",
              value: confirmed,
              icon: BadgeCheck,
              color: "text-blue-400",
              bg: "bg-blue-500/10",
            },
            {
              label: "Today's Revenue",
              value: money(totalToday),
              icon: IndianRupee,
              color: "text-blue-400",
              bg: "bg-blue-500/10",
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="rounded-xl border border-neutral-800 bg-black p-4"
            >
              <div className={`mb-3 w-fit rounded-lg p-2 ${bg}`}>
                <Icon size={17} className={color} />
              </div>
              <p className="text-xl font-semibold text-white">{value}</p>
              <p className="mt-1 text-xs text-neutral-500">{label}</p>
            </div>
          ))}
        </section>

        {/* Empty State */}
        {totalCount === 0 ? (
          <section className="rounded-xl border border-neutral-800 bg-black px-5 py-14 text-center">
            <CalendarX
              size={36}
              className="mx-auto mb-3 text-neutral-600"
            />
            <p className="font-medium text-neutral-300">
              No bookings or subscriptions today
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              New bookings will appear here.
            </p>
          </section>
        ) : (
          <div className="space-y-6">

            {/* Regular Bookings */}
            {todayBookings.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
                    Regular Bookings
                  </h2>
                </div>

                {renderTable(todayBookings)}
              </section>
            )}

            {/* Subscriptions */}
            {todaySubs.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
                    Subscriptions Today
                  </h2>
                </div>

                {renderTable(todaySubs, true)}
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default TodaysBookings;

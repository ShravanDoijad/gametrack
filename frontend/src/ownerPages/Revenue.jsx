
import { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  Clock3,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { BookContext } from "../constexts/bookContext";

const money = (value) =>
  `₹${(Number(value) || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const dateKey = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const Revenue = () => {
  const {
    bookings = [],
    ownerBookingsLoading,
    setCancelled,
  } = useContext(BookContext);

  const [period, setPeriod] = useState("today");

  const today = dateKey(new Date());
  const month = today.slice(0, 7);

  const visibleBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        if (booking.status === "cancelled") return false;

        const key = dateKey(booking.date);

        if (period === "today") return key === today;
        if (period === "month") return key.startsWith(month);

        return true;
      }),
    [bookings, period, today, month]
  );

  const totals = visibleBookings.reduce(
    (summary, booking) => {
      const total = Number(booking.slotFees) || 0;
      const collected = Math.min(
        total,
        Number(booking.amountPaid) || 0
      );

      summary.value += total;
      summary.pending += Math.max(0, total - collected);

      return summary;
    },
    { value: 0, collected: 0, pending: 0 }
  );

  const entries = bookings
    .filter((booking) => booking.status !== "cancelled")
    .flatMap((booking) => {
      const customer =
        booking.userId?.fullname ||
        booking.fullname ||
        booking.phone ||
        "Customer";

      const events = booking.paymentHistory || [];

      if (events.length) {
        return events.map((event, index) => ({
          id: `${booking._id}-${event._id || index}`,
          bookingId: booking._id,
          customer,
          amount: Number(event.amount) || 0,
          method: event.method || "Other",
          receivedAt: event.receivedAt || booking.createdAt,
          legacy: false,
        }));
      }

      if (Number(booking.amountPaid) > 0) {
        return [
          {
            id: `${booking._id}-legacy`,
            bookingId: booking._id,
            customer,
            amount: Number(booking.amountPaid),
            method: booking.razorpay_payment_id
              ? "Online"
              : "Payment on booking",
            receivedAt: booking.createdAt || booking.date,
            legacy: true,
          },
        ];
      }

      return [];
    })
    .filter((entry) => {
      const key = dateKey(entry.receivedAt);

      if (period === "today") return key === today;
      if (period === "month") return key.startsWith(month);

      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.receivedAt || 0) -
        new Date(a.receivedAt || 0)
    );

  totals.collected = entries.reduce(
    (sum, entry) => sum + entry.amount,
    0
  );

  const periodLabel =
    period === "today"
      ? "Today"
      : period === "month"
        ? "This month"
        : "All time";

  const cards = [
    {
      label: "Booking value",
      value: totals.value,
      helper: "Value of active bookings",
      icon: CalendarDays,
    },
    {
      label: "Collected",
      value: totals.collected,
      helper: "Payments recorded as received",
      icon: Wallet,
    },
    {
      label: "Outstanding",
      value: totals.pending,
      helper: "Remaining customer balances",
      icon: Banknote,
    },
  ];

  const inputClass =
    "min-h-10 rounded-lg border px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

  return (
    <main className="min-h-screen bg-black px-4 py-5 text-white sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Payments
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Track booking value, collections, and outstanding balances.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "today", label: "Today" },
              { id: "month", label: "This month" },
              { id: "all", label: "All time" },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setPeriod(option.id)}
                aria-pressed={period === option.id}
                className={`${inputClass} ${
                  period === option.id
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-neutral-900"
                }`}
              >
                {option.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCancelled((value) => !value)}
              disabled={ownerBookingsLoading}
              aria-label="Refresh payments"
              className={`${inputClass} flex w-10 items-center justify-center border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-neutral-900 disabled:opacity-50`}
            >
              <RefreshCw
                size={16}
                className={
                  ownerBookingsLoading ? "animate-spin" : ""
                }
              />
            </button>
          </div>
        </header>

        {/* Summary Cards */}
        <section
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          aria-label="Payment summary"
        >
          {cards.map(({ label, value, helper, icon: Icon }) => (
            <article
              key={label}
              className="rounded-xl border border-neutral-800 bg-black p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400">
                  <Icon size={19} />
                </div>

                <span className="text-xs text-neutral-500">
                  {periodLabel}
                </span>
              </div>

              <p className="mt-4 break-words text-2xl font-semibold tabular-nums">
                {ownerBookingsLoading ? "…" : money(value)}
              </p>

              <h2 className="mt-1 text-sm font-medium text-neutral-200">
                {label}
              </h2>

              <p className="mt-1 text-xs text-neutral-500">
                {helper}
              </p>
            </article>
          ))}
        </section>

        {/* Outstanding Balances */}
        {totals.pending > 0 && (
          <section
            className="flex flex-col gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between"
            aria-label="Outstanding balances"
          >
            <div>
              <h2 className="font-semibold text-amber-400">
                Outstanding balances
              </h2>
              <p className="mt-1 text-sm text-neutral-400">
                {money(totals.pending)} due across{" "}
                {
                  visibleBookings.filter(
                    (booking) =>
                      Number(booking.slotFees) >
                      Number(booking.amountPaid || 0)
                  ).length
                }{" "}
                booking(s).
              </p>
            </div>

            <Link
              to="/owner/bookings"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-neutral-700 bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-900"
            >
              Review bookings <ArrowRight size={16} />
            </Link>
          </section>
        )}

        {/* Payment History */}
        <section
          className="overflow-hidden rounded-xl border border-neutral-800 bg-black"
          aria-labelledby="payment-history-title"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 p-4 sm:p-5">
            <div>
              <h2
                id="payment-history-title"
                className="text-lg font-semibold"
              >
                Payment history
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Recorded collections for active bookings
              </p>
            </div>

            <Link
              to="/owner/bookings"
              className="inline-flex min-h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium text-blue-400 transition hover:bg-blue-500/10"
            >
              Manage balances <ArrowRight size={15} />
            </Link>
          </div>

          {ownerBookingsLoading ? (
            <div
              className="p-8 text-center text-sm text-neutral-400"
              role="status"
            >
              Loading payment records…
            </div>
          ) : entries.length === 0 ? (
            <div className="p-10 text-center">
              <Clock3
                className="mx-auto text-neutral-600"
                size={30}
              />
              <p className="mt-3 font-medium text-neutral-300">
                No payments recorded in this period
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                Recorded payments will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-neutral-800 bg-neutral-950 text-xs uppercase tracking-wide text-neutral-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">
                        Customer / Booking
                      </th>
                      <th className="px-5 py-3 font-medium">
                        Method
                      </th>
                      <th className="px-5 py-3 font-medium">
                        Received
                      </th>
                      <th className="px-5 py-3 text-right font-medium">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-neutral-800">
                    {entries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="transition hover:bg-neutral-900/60"
                      >
                        <td className="px-5 py-4">
                          <span className="font-medium text-white">
                            {entry.customer}
                          </span>
                          <span className="mt-1 block text-xs text-neutral-500">
                            Booking · {entry.bookingId?.slice(-7) || "—"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-block rounded-md border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-xs text-neutral-300">
                            {entry.method}
                          </span>
                          {entry.legacy && (
                            <span className="ml-2 text-xs text-neutral-500">
                              Older record
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-neutral-400">
                          {entry.receivedAt
                            ? new Date(
                                entry.receivedAt
                              ).toLocaleString("en-IN", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "Date unavailable"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold tabular-nums text-blue-400">
                          {money(entry.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Payment History */}
              <ul className="divide-y divide-neutral-800 sm:hidden">
                {entries.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-start justify-between gap-3 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {entry.customer}
                      </p>

                      <p className="mt-1 text-xs text-neutral-400">
                        {entry.method}
                        {entry.legacy ? " · Older record" : ""}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        Booking · {entry.bookingId?.slice(-7) || "—"}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        {entry.receivedAt
                          ? new Date(
                              entry.receivedAt
                            ).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "Date unavailable"}
                      </p>
                    </div>

                    <strong className="shrink-0 text-sm tabular-nums text-blue-400">
                      {money(entry.amount)}
                    </strong>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <p className="text-xs leading-relaxed text-neutral-500">
          Older bookings may not contain a separate payment method or
          timestamp. Online payments should only be recorded after
          backend payment verification.
        </p>
      </div>
    </main>
  );
};

export default Revenue;

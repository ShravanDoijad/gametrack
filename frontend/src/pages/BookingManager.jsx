/* eslint-disable react/prop-types */
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { ArrowLeft, CalendarDays, Check } from "lucide-react";
import { BookContext } from "../constexts/bookContext";
import SkeletonLoader from "../components/SkeletonLoader";
import en from "../multilingual/locales/en.json";
import mr from "../multilingual/locales/mr.json";
import hi from "../multilingual/locales/hi.json";

const LANGS = [
  { id: "en", name: "English", locale: "en-IN" },
  { id: "mr", name: "\u092e\u0930\u093e\u0920\u0940", locale: "mr-IN" },
  { id: "hi", name: "\u0939\u093f\u0928\u094d\u0926\u0940", locale: "hi-IN" },
];
const TEXT = { en, mr, hi };

const DURATIONS = [1, 1.5, 2, 3];
const formatINR = (amount) => `\u20b9${(Number(amount) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const calculateIntervalTotal = (turf, startMinute, durationHours) => {
  const [cutoffHour, cutoffMinute = 0] = (turf?.nightPriceStart || "").split(":").map(Number);
  const cutoff = Number.isFinite(cutoffHour) ? cutoffHour * 60 + cutoffMinute : null;
  const endMinute = startMinute + durationHours * 60;
  let total = 0;
  for (let minute = startMinute; minute < endMinute; minute += 1) {
    const minuteOfDay = minute % 1440;
    const rate = cutoff !== null && minuteOfDay >= cutoff ? Number(turf.nightPrice) : Number(turf.dayPrice);
    total += rate / 60;
  }
  return Math.round((total + Number.EPSILON) * 100) / 100;
};
const durationLabel = (d, t) => d === 1
  ? t("durationOne")
  : d === 1.5
    ? t("durationHalf")
    : t("durationHours", { count: d });
/* ------------------------------------------------------------------ */
const toMin = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const toMilitary = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const to12h = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}${m ? ":" + String(m).padStart(2, "0") : ""} ${h >= 12 ? "PM" : "AM"}`;
};
const dateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sameDay = (a, b) => a && b && dateKey(a) === dateKey(b);

const Chip = ({ active, disabled, onClick, children, className = "", unavailableLabel = "Unavailable" }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`rounded-2xl border-2 px-3 py-4 text-lg font-bold transition active:scale-95 ${
      active
        ? "bg-lime-400 text-gray-950 border-lime-400"
        : disabled
          ? "bg-white/5 text-gray-600 border-transparent line-through cursor-not-allowed"
          : "bg-white/5 text-white border-white/20"
    } ${className}`}
  >
    {disabled ? <><span className="block">{children}</span><span className="mt-1 block text-xs font-semibold no-underline">{unavailableLabel}</span></> : children}
  </button>
);

const Step = ({ title, children, sectionRef, tourTarget, tourComplete }) => (
  <section ref={sectionRef} data-tour={tourTarget} data-tour-complete={tourComplete ? "true" : "false"} className="mt-7">
    <h3 className="text-xl font-extrabold text-white mb-3">{title}</h3>
    {children}
  </section>
);

const FlowNavigator = ({ steps, activeIndex }) => (
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3" aria-label="Booking progress">
    {steps.map((step, index) => {
      const complete = index < activeIndex;
      const active = index === activeIndex;
      return (
        <div
          key={step.id}
          aria-current={active ? "step" : undefined}
          className={`flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold sm:text-sm ${
            active
              ? "border-lime-400/60 bg-lime-400/10 text-lime-300"
              : complete
                ? "border-emerald-400/30 bg-emerald-400/5 text-emerald-300"
                : "border-white/10 bg-white/[0.03] text-gray-500"
          }`}
        >
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
            active ? "bg-lime-400 text-gray-950" : complete ? "bg-emerald-400 text-gray-950" : "bg-white/10 text-gray-400"
          }`}>
            {complete ? <Check size={14} strokeWidth={3} /> : index + 1}
          </span>
          <span className="truncate">{step.title}</span>
        </div>
      );
    })}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
const BookingManager = () => {
  const { selectedSport, userInfo, fetchToken, token } = useContext(BookContext);
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem("lang");
      return LANGS.some((item) => item.id === saved) ? saved : "en";
    } catch {
      return "en";
    }
  });
  const locale = LANGS.find((item) => item.id === lang)?.locale || "en-IN";
  const t = (key, options = {}) => {
    const aliases = { failed: "paymentFailed", closed: "paymentClosed" };
    const path = key.startsWith("common.") ? key : `booking.${aliases[key] || key}`;
    const valueAtPath = (source) => path.split(".").reduce((value, part) => value?.[part], source);
    let value = valueAtPath(TEXT[lang]) || valueAtPath(TEXT.en) || key;
    for (const [name, replacement] of Object.entries(options)) {
      value = value.replaceAll(`{{${name}}}`, String(replacement));
    }
    return value;
  };
  const changeLang = (next) => {
    setLang(next);
    try { localStorage.setItem("lang", next); } catch { /* localStorage may be unavailable. */ }
  };
  const location = useLocation();
  const navigate = useNavigate();
  const { turfId: routeTurfId } = useParams();
  const [searchParams] = useSearchParams();
  const requestedTurfId = routeTurfId || searchParams.get("turfId") || location.state?.turfId;
  const timeStepRef = useRef(null);
  const durationStepRef = useRef(null);
  const summaryRef = useRef(null);

  const selectedPlanId = searchParams.get("planId");

  const [turf, setTurf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState("closed");
  const [paymentChoice, setPaymentChoice] = useState("later");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutOtp, setCheckoutOtp] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [date, setDate] = useState(null);
  const [sport, setSport] = useState(null);
  const [startMin, setStartMin] = useState(null);
  const [duration, setDuration] = useState(null);

  /* ---- load the (single) turf ---- */

  useEffect(() => {
    if (!requestedTurfId) {
      setLoading(false);
      toast.error(
        t("turfIdMissing"),
      );
      return;
    }

    const load = async () => {
      try {
        const res = await axios.get("/api/turfs/getSingleTurf", {
          params: { id: requestedTurfId },
        });
        setTurf(res.data.turf);
      } catch (error) {
        toast.error(
          error.response?.data?.message || t("turfLoadFailed"),
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [requestedTurfId]);

  const plan = selectedPlanId
    ? turf?.subscription?.find((item) => item._id === selectedPlanId)
    : location.state?.plan;
  const invalidPlan = Boolean(selectedPlanId && turf && !plan);
  const isSubscription = Number(plan?.days) > 0;

  useEffect(() => {
    if (!turf) return;
    const sports = turf.sportsAvailable || [];
    setSport(
      sports.includes(selectedSport) ? selectedSport : sports[0] || null,
    );
  }, [turf, selectedSport]);

  /* ---- days to choose from ---- */
  const today = startOfDay(new Date());
  const maxDate = new Date(
    today.getFullYear(),
    today.getMonth() + 4,
    today.getDate(),
  );
  const quickDays = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const fullDate = (d) =>
    d.toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

  const pickDate = (d) => {
    setDate(d);
    setStartMin(null);
    setDuration(null);
  };

  useEffect(() => {
    if (duration !== null) timeStepRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [duration]);

  useEffect(() => {
    if (duration !== null) summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [duration]);

  /* ---- which start times are free? ---- */
  const openMin = turf?.openingTime ? toMin(turf.openingTime) : 0;
  const closeMin = turf?.closingTime ? toMin(turf.closingTime) : 0;

  const dateAvailability = useMemo(() => {
    if (!turf || !date) return null;
    return turf.bookedSlots?.find((s) => s.date === dateKey(date)) || null;
  }, [turf, date]);
  const bookedForDate = dateAvailability?.slots || [];

  const fits = (start, hours) => {
    const end = start + hours * 60;
    if (dateAvailability?.status === "unavailable" || end > closeMin) return false;
    return !bookedForDate.some(
      (b) => toMin(b.start) < end && toMin(b.end) > start,
    );
  };

  const startTimes = useMemo(() => {
    if (!turf || !date || !duration) return [];
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const list = [];
    for (let s = openMin; s + duration * 60 <= closeMin; s += 30) {
      const isPast = sameDay(date, today) && s <= nowMin;
      if (isPast) continue;
      list.push({ min: s, free: fits(s, duration) });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turf, date, duration, dateAvailability]);

  const groups = [
    { id: "morning", items: startTimes.filter((s) => s.min < 12 * 60) },
    {
      id: "afternoon",
      items: startTimes.filter((s) => s.min >= 12 * 60 && s.min < 17 * 60),
    },
    { id: "evening", items: startTimes.filter((s) => s.min >= 17 * 60) },
  ];
  const anyFree = startTimes.some((s) => s.free);

  /* ---- money (same formulas as before) ---- */
  const priceFor = (start) => {
    const switchHour = parseInt(turf?.nightPriceStart?.split(":")[0]);
    return Math.floor(start / 60) >= switchHour
      ? turf.nightPrice
      : turf.dayPrice;
  };
  const feeFor = (start, hours) => calculateIntervalTotal(turf, start, hours);

  const money = useMemo(() => {
    if (!turf || startMin === null || !duration) return null;
    if (isSubscription) {
      const total = duration * plan.amount;
      const advance = Math.round(total * 0.2);
      const advanceWithFee = Math.round(advance + advance * 0.0218);
      return {
        total,
        payNow: advanceWithFee,
        fee: advanceWithFee - advance,
        payLater: total - advance,
      };
    }
    const total = feeFor(startMin, duration);
    const payNow = Math.round(total * 0.2 * 100) / 100;
    return { total, payNow, fee: 0, payLater: Math.max(total - payNow, 0) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turf, startMin, duration, isSubscription, plan]);

  const planEnd =
    isSubscription && date ? addDays(date, parseInt(plan.days) - 1) : null;
  const ready = !!(date && startMin !== null && duration && money && sport);
  const needsPhoneVerification = !token || !userInfo?._id;
  const flowSteps = [
    { id: "slot", title: t("stepDay") },
    { id: "review", title: t("summary") },
    ...(needsPhoneVerification ? [{ id: "verify", title: t("verifyOtp") }] : []),
    { id: "payment", title: t("paymentChoice") },
  ];
  const flowStepId = checkoutStep === "closed"
    ? "slot"
    : checkoutStep === "confirmation"
      ? "review"
      : checkoutStep === "phone" || checkoutStep === "otp"
        ? "verify"
        : "payment";
  const activeFlowIndex = Math.max(0, flowSteps.findIndex((step) => step.id === flowStepId));

  const beginCheckout = () => {
    if (!ready || paying) return;
    setPaymentChoice("later");
    setCheckoutStep("confirmation");
  };

  const requestCheckoutOtp = async () => {
    if (checkoutPhone.length !== 10) return toast.error(t("enterPhoneError"));
    setOtpSending(true);
    try {
      const { data } = await axios.post("/api/users/login", { identifier: checkoutPhone });
      if (!data.success) throw new Error(data.message || t("bookingError"));
      setCheckoutStep("otp");
      toast.success(t("otpSent"));
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || t("bookingError"));
    } finally {
      setOtpSending(false);
    }
  };

  const verifyCheckoutOtp = async () => {
    if (checkoutOtp.length !== 6) return toast.error(t("enterOtpError"));
    setOtpVerifying(true);
    try {
      const { data } = await axios.post("/otp/verifyOtp", { identifier: checkoutPhone, otp: checkoutOtp });
      if (!data.success) throw new Error(data.message || t("otpVerifyFailed"));
      await fetchToken();
      setCheckoutStep("payment");
      toast.success(t("phoneVerifiedToast"));
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || t("otpVerifyFailed"));
    } finally {
      setOtpVerifying(false);
    }
  };

  const confirmWithoutAdvance = async () => {
    if (!ready || !userInfo?._id || paying) return;
    if (isSubscription) return toast.error(t("advanceRequired"));
    setPaying(true);
    try {
      const bookingDetails = {
        turfId: turf._id,
        date: dateKey(date),
        slots: [{ start: toMilitary(startMin), end: toMilitary(startMin + duration * 60) }],
        sport,
        amount: 0,
        duration: duration.toFixed(1),
        slotFees: money.total,
        paymentType: "Manual",
      };
      const { data } = await axios.post("/api/users/confirmBooking", { bookingDetails });
      if (!data.success) throw new Error(data.message || t("bookingError"));
      navigate(`/booking/confirmation/${data.booking._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || t("failed"));
    } finally {
      setPaying(false);
    }
  };

  /* ---- payment ---- */
  const openCheckout = ({ order, title, description, verifyBody, onDone }) => {
    if (!window.Razorpay) {
      toast.error(t("failed"));
      setPaying(false);
      return;
    }
    const rzp = new window.Razorpay({
      modal: {
        ondismiss: () => {
          toast.info(t("closed"));
          setPaying(false);
        },
      },
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: "INR",
      name: title,
      description,
      order_id: order.id,
      handler: async (response) => {
        try {
          const verify = await axios.post("/api/users/verifyPayment", {
            userId: userInfo._id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            ...verifyBody,
          });
          if (verify.data.success && verify.data.booking?._id) onDone(verify.data.booking);
          else toast.error(t("failed"));
        } catch (err) {
          console.error(err);
          toast.warning(t("verifyError"));
        } finally {
          setPaying(false);
        }
      },
      prefill: { name: userInfo.fullname, contact: userInfo.phone },
      theme: { color: "#00ff87" },
    });
    rzp.open();
  };

  const pay = async () => {
    if (!ready || paying) return;
    if (!token || !userInfo?._id) {
      setCheckoutStep("phone");
      return;
    }
    setPaying(true);
    const start = toMilitary(startMin);
    const end = toMilitary(startMin + duration * 60);
    const durationText = duration.toFixed(1);
    try {
      if (isSubscription) {
        const subscriptionDetails = {
          turfId: turf._id,
          userId: userInfo._id,
          planId: plan._id,
          durationDays: parseInt(plan.days),
          fromDate: dateKey(date),
          toDate: dateKey(planEnd),
          slot: { start, end },
          duration: durationText,
          sport,
          pricePerHour: priceFor(startMin),
          totalAmount: money.total,
          paymentType: "advance",
          advanceAmount: money.payNow,
        };
        const { data } = await axios.post("/api/users/createOrder", {
          amount: money.payNow,
          currency: "INR",
          receipt: `subscription_advance_${Date.now()}`,
          subscriptionDetails,
        });
        openCheckout({
          order: data.order,
          title: `${turf.name} Subscription (Advance)`,
          description: `Subscription advance for ${sport}`,
          verifyBody: { subscriptionDetails },
          onDone: (booking) => navigate(`/booking/confirmation/${booking._id}`),
        });
      } else {
        const bookingDetails = {
          turfId: turf._id,
          userId: userInfo._id,
          date: dateKey(date),
          slots: [{ start, end }],
          sport,
          amount: money.payNow,
          duration: durationText,
          slotFees: money.total,
          paymentType: "advance",
          turfName: turf.name,
          location: turf.location,
          amenities: turf.amenities,
          policies: turf.onSitePolicies,
        };
        const { data } = await axios.post("/api/users/createOrder", {
          amount: money.payNow,
          currency: "INR",
          receipt: `booking_${Date.now()}`,
          bookingDetails,
        });
        openCheckout({
          order: data.order,
          title: `${turf.name} Booking`,
          description: `Booking for ${sport}`,
          verifyBody: { bookingDetails },
          onDone: (booking) => navigate(`/booking/confirmation/${booking._id}`),
        });
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || t("failed"));
      setPaying(false);
    }
  };

  /* ---- screens ---- */
  if (loading) return <SkeletonLoader />;

  if (!turf) {
    return (
      <div className="text-white text-center mt-24 text-xl px-6">
        {t("turfNotFound")}
      </div>
    );
  }

  if (invalidPlan) {
    return (
      <div className="mx-auto mt-24 max-w-xl px-6 text-center text-white">
        <p className="text-xl font-bold">{t("turfNotFound")}</p>
        <button onClick={() => navigate(`/overview/${turf._id}`)} className="mt-5 rounded-xl bg-lime-400 px-5 py-3 font-bold text-gray-950">Back to turf</button>
      </div>
    );
  }

  const isCustomDate = date && !quickDays.some((d) => sameDay(d, date));

  return (
    <div className="px-5 pb-48 text-white max-w-3xl mx-auto">
      {/* Turf identity and language */}
      <div className="flex items-start justify-between gap-3 pt-4">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center gap-3">
            <button type="button" onClick={() => navigate(-1)} className="rounded-full border border-white/15 px-3 py-1 text-sm font-bold text-gray-200 hover:bg-white/10" aria-label="Back"><ArrowLeft size={18} /></button>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-lime-400">GameTrack booking</span>
          </div>
          <div className="flex items-center gap-4">
            {turf.images?.[0] && <img src={turf.images[0]} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />}
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-extrabold sm:text-3xl">{turf.name}</h1>
              {turf.location && <p className="mt-1 text-sm text-gray-400">{[turf.location.address, turf.location.city, turf.location.pincode].filter(Boolean).join(", ")}</p>}
            </div>
          </div>
        </div>
        <div className="hidden md:flex shrink-0 rounded-full bg-white/10 p-1">
          {LANGS.map((item) => <button key={item.id} onClick={() => changeLang(item.id)} className={`px-3 py-1 rounded-full text-sm font-bold ${lang === item.id ? "bg-lime-400 text-gray-950" : "text-gray-300"}`}>{item.name}</button>)}
        </div>
      </div>
      <div className="fixed top-[5.25rem] right-3 z-[60] flex rounded-full border border-gray-200 bg-white p-1 shadow-lg md:hidden">
        {LANGS.map((item) => <button key={item.id} onClick={() => changeLang(item.id)} className={`px-3 py-1 rounded-full text-sm font-bold ${lang === item.id ? "bg-lime-400 text-gray-950" : "text-gray-700"}`}>{item.name}</button>)}
      </div>
      <section className="mt-6 rounded-2xl border border-lime-400/20 bg-gradient-to-br from-lime-400/[0.08] to-transparent p-4 sm:p-5">
        <div className="mb-3 flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lime-400 font-black text-gray-950">G</span>
          <div className="min-w-0">
            <h2 className="font-extrabold text-white">GameTrack <span className="font-semibold text-lime-300">· {t("title")}</span></h2>
            <p className="mt-1 text-xs leading-relaxed text-gray-400 sm:text-sm">{t("confirmDetails")}</p>
          </div>
        </div>
        <FlowNavigator steps={flowSteps} activeIndex={activeFlowIndex} />
      </section>
      {isSubscription && (
        <div className="mt-4 rounded-2xl bg-lime-400/10 border border-lime-400/30 p-4 text-lg">
          <span className="font-bold text-lime-400">{t("plan")}:</span>{" "}
          {plan.days} {t("common.days")}{" "}
          {plan.description ? `â€“ ${plan.description}` : ""}
        </div>
      )}

      {/* 1. Day */}
      <Step title={t("stepDay")} tourTarget={!date || (date && duration && !anyFree) ? "booking-selection" : undefined} tourComplete={ready}>
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
          {quickDays.map((d, i) => (
            <Chip key={i} active={sameDay(d, date)} onClick={() => pickDate(d)} className="min-w-[112px] snap-start px-4 py-3">
              <span className="block text-sm font-semibold">{i === 0 ? t("today") : i === 1 ? t("tomorrow") : d.toLocaleDateString(locale, { weekday: "short" })}</span>
              <span className="mt-1 block text-xl">{d.toLocaleDateString(locale, { day: "numeric", month: "short" })}</span>
            </Chip>
          ))}
          <label
            className={`relative flex min-w-[112px] snap-start items-center justify-center gap-2 rounded-2xl border-2 px-3 py-4 text-base font-bold active:scale-95 cursor-pointer ${
              isCustomDate
                ? "bg-lime-400 text-gray-950 border-lime-400"
                : "bg-white/5 border-white/20"
            }`}
          >
            <CalendarDays size={22} />
            {isCustomDate ? fullDate(date) : t("otherDate")}
            <input
              type="date"
              min={dateKey(today)}
              max={dateKey(maxDate)}
              value={date ? dateKey(date) : ""}
              onChange={(e) => {
                if (!e.target.value) return;
                const [y, m, d] = e.target.value.split("-").map(Number);
                pickDate(new Date(y, m - 1, d));
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </label>
        </div>
      </Step>

      {/* 3. Duration */}
      {date && (
        <Step title={t("stepHours")} sectionRef={durationStepRef} tourTarget={date && !duration ? "booking-selection" : undefined} tourComplete={ready}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {DURATIONS.map((d) => (
              <Chip key={d} active={duration === d} onClick={() => { setDuration(d); setStartMin(null); }} className="py-3">
                {durationLabel(d, t)}
              </Chip>
            ))}
          </div>
        </Step>
      )}

      {/* Optional game selection */}
      {turf.sportsAvailable?.length > 1 && (
        <Step title={t("stepGame")}>
          <div className="grid grid-cols-2 gap-3">
            {turf.sportsAvailable.map((s) => (
              <Chip
                key={s}
                active={sport === s}
                onClick={() => setSport(s)}
                className="capitalize"
              >
                {s}
              </Chip>
            ))}
          </div>
        </Step>
      )}

      {/* 4. Time: availability covers the entire selected duration */}
      {date && duration && (
        <Step title={t("stepTime")} sectionRef={timeStepRef} tourTarget={date && duration && anyFree ? "booking-selection" : undefined} tourComplete={ready}>
          {!anyFree ? (
            <p className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-base text-amber-200">{t("noTimesForDuration", { duration: durationLabel(duration, t) })}</p>
          ) : (
            groups.map((g) => g.items.length > 0 && (
              <div key={g.id} className="mb-5">
                <p className="mb-2 text-lg text-gray-400">{t(g.id)}</p>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {g.items.map((slot) => (
                    <Chip key={slot.min} active={startMin === slot.min} disabled={!slot.free} unavailableLabel={t("unavailable")} onClick={() => setStartMin(slot.min)}>
                      {to12h(slot.min)}
                    </Chip>
                  ))}
                </div>
              </div>
            ))
          )}
        </Step>
      )}

      {/* Summary */}
      {ready && checkoutStep === "closed" && (
        <section ref={summaryRef} className="mt-8 rounded-3xl bg-white/5 border border-white/15 p-5 text-lg">
          <h3 className="text-xl font-extrabold mb-3">{t("summary")}</h3>
          <Row
            label={t("day")}
            value={
              isSubscription
                ? `${fullDate(date)} â†’ ${fullDate(planEnd)}`
                : fullDate(date)
            }
          />
          <Row
            label={t("time")}
            value={`${to12h(startMin)} - ${to12h(startMin + duration * 60)}`}
          />
          <Row label={t("stepHours")} value={durationLabel(duration, t)} />
          <Row label={t("hourlyRate")} value={`\u20b9${Math.round(money.total / duration)}`} />
          <Row
            label={t("game")}
            value={<span className="capitalize">{sport}</span>}
          />
          <Row label={t("total")} value={`${money.total}`} />
          {money.fee > 0 && (
            <Row label={t("onlineFee")} value={`${money.fee}`} />
          )}
          <div className="mt-3 pt-3 border-t border-white/15">
            <Row
              label={t("payNow")}
              value={
                <span className="text-2xl font-extrabold text-lime-400">
                  {money.payNow}
                </span>
              }
            />
            <Row label={t("payAtTurf")} value={`${money.payLater}`} />
          </div>

      {turf.onSitePolicies?.length > 0 && (
            <details className="mt-4 text-base text-gray-300">
              <summary className="cursor-pointer font-bold">
                {t("rules")}
              </summary>
              <ul className="mt-2 space-y-1">
                {turf.onSitePolicies.map((p, i) => (
                  <li key={i}> {p}</li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}

      {/* Compact sticky summary and continue action */}
      <div className="pointer-events-none fixed bottom-24 left-0 right-0 z-40 px-4 sm:px-5">
        <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl border border-white/10 bg-gray-950/95 p-3 shadow-[0_10px_35px_rgba(0,0,0,0.45)] backdrop-blur">
          {ready && (
            <div className="mb-2 flex items-center justify-between gap-3 px-1 text-sm">
              <span className="truncate text-gray-300">{fullDate(date)} | {to12h(startMin)} | {durationLabel(duration, t)}</span>
              <span className="shrink-0 font-extrabold text-white">{money.total}</span>
            </div>
          )}
          <button
            data-tour="book-now"
            data-tour-complete={checkoutStep !== "closed" ? "true" : "false"}
            onClick={checkoutStep === "payment" ? pay : beginCheckout}
            disabled={!ready || paying}
            className={`block w-full rounded-xl py-3 text-lg font-extrabold transition active:scale-[0.99] ${
              ready && !paying
                ? "bg-lime-400 text-gray-950 shadow-[0_10px_30px_rgba(163,230,53,0.25)]"
                : "bg-gray-700 text-gray-400"
            }`}
          >
            {paying ? t("wait") : ready ? `${t("common.continue")} | \u20b9${money.total}` : t("needMore")}
          </button>
        </div>
      </div>

      {checkoutStep !== "closed" && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 py-6">
          <section className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-gray-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-lime-400">{t("confirmTitle")}</p>
                <h2 className="mt-1 text-2xl font-extrabold">{turf.name}</h2>
              </div>
              <button onClick={() => setCheckoutStep("closed")} className="rounded-full bg-white/10 px-3 py-1 text-gray-300" aria-label={t("common.close")}>&times;</button>
            </div>
            <div className="mt-4">
              <FlowNavigator steps={flowSteps} activeIndex={activeFlowIndex} />
            </div>
            <div className="mt-5 space-y-2 rounded-2xl bg-white/5 p-4 text-base">
              <Row label={t("common.date")} value={fullDate(date)} />
              <Row label={t("common.time")} value={`${to12h(startMin)} - ${to12h(startMin + duration * 60)}`} />
              <Row label={t("common.game")} value={<span className="capitalize">{sport}</span>} />
              {isSubscription && <Row label={t("plan")} value={`${plan.days} ${t("common.days")}`} />}
              <Row label={t("total")} value={formatINR(money.total)} />
              <Row label={t("payNow")} value={<span className="font-extrabold text-lime-400">{formatINR(money.payNow)}</span>} />
              <Row label={t("payAtTurf")} value={formatINR(money.payLater)} />
            </div>

            {checkoutStep === "confirmation" && (
              <>
                <p className="mt-4 text-sm text-gray-400">{t("confirmDetails")}</p>
                <button onClick={() => setCheckoutStep(token && userInfo?._id ? "payment" : "phone")} className="mt-5 w-full rounded-xl bg-lime-400 py-3 font-extrabold text-gray-950">{t("confirmBooking")}</button>
              </>
            )}

            {checkoutStep === "phone" && (
              <div className="mt-5">
                <label htmlFor="booking-phone" className="text-sm font-semibold text-gray-200">{t("mobileNumber")}</label>
                <div className="mt-2 flex gap-2">
                  <span className="rounded-xl bg-white/10 px-3 py-3 text-gray-300">+91</span>
                  <input id="booking-phone" type="tel" inputMode="numeric" maxLength={10} value={checkoutPhone} onChange={(e) => setCheckoutPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder={t("phonePlaceholder")} className="min-w-0 flex-1 rounded-xl bg-white px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-lime-400" />
                </div>
                <button disabled={otpSending} onClick={requestCheckoutOtp} className="mt-4 w-full rounded-xl bg-lime-400 py-3 font-extrabold text-gray-950 disabled:opacity-50">{otpSending ? t("sendingOtp") : t("sendOtp")}</button>
              </div>
            )}

            {checkoutStep === "otp" && (
              <div className="mt-5">
                <p className="text-sm text-gray-300">{t("otpPrompt", { phone: checkoutPhone })}</p>
                <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={checkoutOtp} onChange={(e) => setCheckoutOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} aria-label="6-digit OTP" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢" className="mt-3 w-full rounded-xl bg-white px-4 py-3 text-center text-xl tracking-[0.5em] text-gray-900 outline-none focus:ring-2 focus:ring-lime-400" />
                <button disabled={otpVerifying} onClick={verifyCheckoutOtp} className="mt-4 w-full rounded-xl bg-lime-400 py-3 font-extrabold text-gray-950 disabled:opacity-50">{otpVerifying ? t("verifyingOtp") : t("verifyOtp")}</button>
                <button onClick={() => setCheckoutStep("phone")} className="mt-3 w-full py-2 text-sm text-gray-400">{t("changePhone")}</button>
              </div>
            )}

            {checkoutStep === "payment" && (
              <>
                {!isSubscription ? (
                  <fieldset className="mt-5 space-y-3">
                    <legend className="mb-2 text-sm font-bold text-gray-200">{t("paymentChoice")}</legend>
                    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${paymentChoice === "later" ? "border-lime-400 bg-lime-400/10" : "border-white/10 bg-white/5"}`}>
                      <input type="radio" name="booking-payment-choice" value="later" checked={paymentChoice === "later"} onChange={() => setPaymentChoice("later")} className="mt-1 accent-lime-400" />
                      <span><span className="block font-bold text-white">{t("withoutAdvance")}</span><span className="text-sm text-gray-400">{t("payAtTurfAmount", { amount: Number(money.total).toLocaleString("en-IN", { maximumFractionDigits: 2 }) })}</span></span>
                    </label>
                    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${paymentChoice === "advance" ? "border-lime-400 bg-lime-400/10" : "border-white/10 bg-white/5"}`}>
                      <input type="radio" name="booking-payment-choice" value="advance" checked={paymentChoice === "advance"} onChange={() => setPaymentChoice("advance")} className="mt-1 accent-lime-400" />
                      <span><span className="block font-bold text-white">{t("withAdvance")}</span><span className="text-sm text-gray-400">{t("advanceDescription", { amount: Number(money.payNow).toLocaleString("en-IN", { maximumFractionDigits: 2 }) })}</span></span>
                    </label>
                  </fieldset>
                ) : <p className="mt-4 text-sm text-gray-300">{t("subscriptionAdvance", { amount: Number(money.payNow).toLocaleString("en-IN", { maximumFractionDigits: 2 }) })}</p>}
                <p className="mt-4 text-sm text-gray-300">{t("phoneVerified")}</p>
                <button disabled={paying} onClick={paymentChoice === "advance" || isSubscription ? pay : confirmWithoutAdvance} className="mt-5 w-full rounded-xl bg-lime-400 py-3 font-extrabold text-gray-950 disabled:opacity-50">{paying ? t("pleaseWait") : paymentChoice === "advance" || isSubscription ? t("payAmount", { amount: money.payNow }) : t("confirmNoAdvance")}</button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 py-1.5">
    <span className="text-gray-300">{label}</span>
    <span className="font-bold text-right">{value}</span>
  </div>
);

export default BookingManager;

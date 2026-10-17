import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BookContext } from "../constexts/bookContext";

const ProductTourContext = createContext(null);
const TOUR_STORAGE_KEY = "gametrack-product-tour-status";

const getSavedStatus = () => {
  try {
    return window.localStorage.getItem(TOUR_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const PRODUCT_TOUR_STEPS = [
  {
    target: "login-button",
    title: "Your GameTrack account",
    body: "Log in to manage bookings and notifications. Login is optional for this tour; you can continue as a guest and verify your phone when booking.",
    nextLabel: "Continue as guest",
  },
  {
    target: "explore-turfs",
    title: "Explore turfs",
    body: "Use this navigation item to return to turf discovery. This app is currently configured for one turf, so it opens that turf's overview directly.",
    nextLabel: "Explore turfs",
  },
  {
    target: "turf-card",
    title: "Turf details",
    body: "This is the selected turf's overview. Review its photos, pricing, and facilities here, then continue to choose a slot.",
    nextLabel: "Choose a slot",
  },
  {
    target: "booking-selection",
    title: "Choose a date and time",
    body: "Select a day, duration, and available start time. The next step unlocks once the booking slot is complete.",
    nextLabel: "Next",
    requiresSelection: true,
  },
  {
    target: "book-now",
    title: "Continue to booking",
    body: "Continue to review your booking. New users verify their phone, then choose an advance payment or payment at the turf. No booking is placed until you complete the real confirmation/payment step.",
    nextLabel: "Open booking options",
    requiresBookAction: true,
  },
];

export const ProductTourProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasCheckedAuth, userInfo } = useContext(BookContext);
  const [savedStatus, setSavedStatus] = useState(getSavedStatus);
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [targetReady, setTargetReady] = useState(false);
  const [targetMissing, setTargetMissing] = useState(false);
  const autoStartAttempted = useRef(false);

  const startTour = useCallback(() => {
    try {
      window.localStorage.removeItem(TOUR_STORAGE_KEY);
    } catch { /* Storage can be disabled. */ }
    setSavedStatus(null);
    setStepIndex(0);
    setActive(true);
    navigate("/");
  }, [navigate]);

  const finishTour = useCallback((status) => {
    try {
      window.localStorage.setItem(TOUR_STORAGE_KEY, status);
    } catch { /* The current session still keeps the tour dismissed. */ }
    setSavedStatus(status);
    setActive(false);
    setBusy(false);
  }, []);

  const exitTour = useCallback(() => finishTour("dismissed"), [finishTour]);

  useEffect(() => {
    const customerRoute = location.pathname === "/" ||
      location.pathname.startsWith("/overview/") ||
      location.pathname.startsWith("/booking/");
    if (!hasCheckedAuth || autoStartAttempted.current || savedStatus ||
        userInfo?.role === "owner" || !customerRoute) return undefined;

    autoStartAttempted.current = true;
    const timer = window.setTimeout(() => setActive(true), 700);
    return () => window.clearTimeout(timer);
  }, [hasCheckedAuth, location.pathname, savedStatus, userInfo?.role]);

  const advanceTour = useCallback(async () => {
    if (!active || busy) return;
    const step = PRODUCT_TOUR_STEPS[stepIndex];
    const target = document.querySelector(`[data-tour="${step.target}"]`);
    if (!target) return;

    if (step.requiresSelection && target.dataset.tourComplete !== "true") return;

    if (stepIndex === 0) {
      setStepIndex(1);
      return;
    }
    if (stepIndex === 1) {
      setStepIndex(2);
      navigate("/");
      return;
    }
    if (stepIndex === 2) {
      const bookingRoute = target.dataset.tourRoute;
      if (!bookingRoute) return;
      setStepIndex(3);
      navigate(bookingRoute);
      return;
    }
    if (stepIndex === 3) {
      setStepIndex(4);
      return;
    }

    if (step.requiresBookAction) {
      setBusy(true);
      target.click();
      const startedAt = Date.now();
      const waitForCheckout = () => {
        const currentTarget = document.querySelector(`[data-tour="${step.target}"]`);
        if (currentTarget?.dataset.tourComplete === "true") {
          finishTour("completed");
          return;
        }
        if (Date.now() - startedAt > 2000) {
          setBusy(false);
          return;
        }
        window.setTimeout(waitForCheckout, 60);
      };
      window.setTimeout(waitForCheckout, 0);
    }
  }, [active, busy, finishTour, navigate, stepIndex]);

  const value = useMemo(() => ({ active, startTour, exitTour }), [active, startTour, exitTour]);

  return (
    <ProductTourContext.Provider value={value}>
      {children}
      <ProductTourOverlay
        active={active}
        stepIndex={stepIndex}
        busy={busy}
        targetReady={targetReady}
        setTargetReady={setTargetReady}
        targetMissing={targetMissing}
        setTargetMissing={setTargetMissing}
        advanceTour={advanceTour}
        exitTour={exitTour}
        routeKey={location.pathname}
      />
    </ProductTourContext.Provider>
  );
};

export const useProductTour = () => useContext(ProductTourContext) || {
  active: false,
  startTour: () => {},
  exitTour: () => {},
};

const getFocusable = (root) => {
  if (!root) return [];
  const selector = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const children = [...root.querySelectorAll(selector)];
  if (root.matches?.(selector)) children.unshift(root);
  return children.filter((element) => element.getClientRects().length > 0);
};

const ProductTourOverlay = ({ active, stepIndex, busy, targetReady, setTargetReady, targetMissing, setTargetMissing, advanceTour, exitTour, routeKey }) => {
  const targetRef = useRef(null);
  const tooltipRef = useRef(null);
  const [rect, setRect] = useState(null);
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [tooltipPosition, setTooltipPosition] = useState({ left: 16, top: 16 });
  const step = PRODUCT_TOUR_STEPS[stepIndex];

  useEffect(() => {
    if (!active) {
      setRect(null);
      targetRef.current = null;
      setTargetReady(false);
      return undefined;
    }

    let lastScrolledTarget = null;
    setTargetMissing(false);
    const missingTimer = window.setTimeout(() => {
      if (!document.querySelector(`[data-tour="${step.target}"]`)) setTargetMissing(true);
    }, 12000);
    const measure = () => {
      const target = document.querySelector(`[data-tour="${step.target}"]`);
      if (!target) {
        targetRef.current = null;
        setRect(null);
        setTargetReady(false);
        return;
      }

      setTargetMissing(false);
      if (target !== lastScrolledTarget) {
        lastScrolledTarget = target;
        target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        window.setTimeout(() => target.focus?.({ preventScroll: true }), 350);
      }
      targetRef.current = target;
      const box = target.getBoundingClientRect();
      const clipped = {
        x: Math.max(8, box.left),
        y: Math.max(8, box.top),
        width: Math.max(0, Math.min(window.innerWidth - 8, box.right) - Math.max(8, box.left)),
        height: Math.max(0, Math.min(window.innerHeight - 8, box.bottom) - Math.max(8, box.top)),
      };
      setRect(clipped);
      const ready = !step.requiresSelection || target.dataset.tourComplete === "true";
      setTargetReady(ready);
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    measure();
    const interval = window.setInterval(measure, 180);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(missingTimer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, routeKey, step.target, step.requiresSelection, setTargetReady, setTargetMissing]);

  useEffect(() => {
    if (!active) return undefined;
    const target = targetRef.current;
    const focusables = [...getFocusable(target), ...getFocusable(tooltipRef.current)];
    focusables[0]?.focus({ preventScroll: true });

    const trapFocus = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        exitTour();
        return;
      }
      if (event.key !== "Tab") return;
      const currentFocusables = [...getFocusable(targetRef.current), ...getFocusable(tooltipRef.current)];
      if (!currentFocusables.length) {
        event.preventDefault();
        return;
      }
      const first = currentFocusables[0];
      const last = currentFocusables[currentFocusables.length - 1];
      if (event.shiftKey && (document.activeElement === first || !currentFocusables.includes(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !currentFocusables.includes(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trapFocus, true);
    return () => document.removeEventListener("keydown", trapFocus, true);
  }, [active, stepIndex, exitTour, targetReady]);

  useEffect(() => {
    if (!rect) return;
    const width = Math.min(360, window.innerWidth - 24);
    const estimatedHeight = 230;
    const left = Math.min(Math.max(12, rect.x + rect.width / 2 - width / 2), window.innerWidth - width - 12);
    let top = rect.y + rect.height + 14;
    if (top + estimatedHeight > window.innerHeight - 12) top = rect.y - estimatedHeight - 14;
    top = Math.max(12, Math.min(top, window.innerHeight - estimatedHeight - 12));
    setTooltipPosition({ left, top });
  }, [rect, viewport]);

  if (!active) return null;

  const canAdvance = targetReady;
  const x = rect ? Math.max(1, rect.x) : 0;
  const y = rect ? Math.max(1, rect.y) : 0;
  const width = rect ? Math.min(viewport.width - x, rect.width) : 0;
  const height = rect ? Math.min(viewport.height - y, rect.height) : 0;
  const path = rect
    ? `M0 0H${viewport.width}V${viewport.height}H0Z M${x} ${y}H${x + width}V${y + height}H${x}Z`
    : `M0 0H${viewport.width}V${viewport.height}H0Z`;

  return (
    <>
      <svg className="fixed inset-0 z-[10000] h-full w-full" width={viewport.width} height={viewport.height} aria-hidden="true" style={{ pointerEvents: "none" }}>
        <path d={path} fill="rgba(2, 6, 23, 0.78)" fillRule="evenodd" pointerEvents="visiblePainted" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()} />
      </svg>
      <section
        ref={tooltipRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-tour-title"
        className="fixed z-[10001] w-[min(22.5rem,calc(100vw-1.5rem))] rounded-2xl border border-lime-300/30 bg-gray-950 p-4 text-white shadow-[0_18px_70px_rgba(0,0,0,0.75)] sm:p-5"
        style={{ left: tooltipPosition.left, top: tooltipPosition.top }}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-lime-400/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-lime-300">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-lime-400 text-[10px] text-gray-950">G</span>
            GameTrack guide
          </span>
          <span className="text-xs font-semibold text-gray-400">Step {stepIndex + 1} of {PRODUCT_TOUR_STEPS.length}</span>
        </div>
        <h2 id="product-tour-title" className="text-lg font-extrabold">{step.title}</h2>
        <p className="mt-2 text-sm leading-6 text-gray-300">{step.body}</p>
        {!targetReady && (
          <p className="mt-2 text-xs text-lime-300" role="status">
            {targetMissing
              ? "This tour target is unavailable. Exit the tour and continue using the app."
              : step.requiresSelection
                ? "Complete the highlighted selection to continue."
                : "Loading this part of the tour…"}
          </p>
        )}
        <div className="mt-5 flex items-center justify-between gap-3">
          <button type="button" onClick={exitTour} className="min-h-10 rounded-lg px-3 text-sm font-semibold text-gray-400 transition hover:bg-white/5 hover:text-white">Exit Tour</button>
          <button
            type="button"
            onClick={advanceTour}
            disabled={!targetReady || (step.requiresSelection && !canAdvance) || busy}
            className="min-h-11 rounded-xl bg-lime-400 px-4 text-sm font-extrabold text-gray-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {targetMissing ? "Unavailable" : busy ? "Opening…" : step.nextLabel}
          </button>
        </div>
      </section>
    </>
  );
};

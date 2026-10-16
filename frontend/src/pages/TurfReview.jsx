import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, CheckCircle2, LoaderCircle, Star } from "lucide-react";

const TurfReview = () => {
  const [params] = useSearchParams();
  const bookingId = params.get("bookingId");
  const turfId = params.get("turfId");
  const [turfName, setTurfName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!turfId) return undefined;
    axios.get("/api/turfs/getSingleTurf", { params: { id: turfId } })
      .then(({ data }) => { if (active) setTurfName(data.turf?.name || "the turf"); })
      .catch(() => { if (active) setTurfName("the turf"); });
    return () => { active = false; };
  }, [turfId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!bookingId || !turfId) {
      setError("This review link is incomplete. Open your booking history and try again.");
      return;
    }
    if (!rating) {
      setError("Choose a star rating to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await axios.post("/api/users/submitReview", {
        bookingId,
        turfId,
        rating,
        comment: comment.trim(),
      });
      if (!response.data.success) throw new Error(response.data.message || "Could not submit your review.");
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Could not submit your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[70vh] px-4 py-10 text-white sm:px-6 sm:py-16">
      <div className="mx-auto max-w-xl">
        <Link to="/userBookings" className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-gray-400 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"><ArrowLeft size={17} aria-hidden="true" /> Your bookings</Link>

        {submitted ? (
          <section className="mt-6 rounded-3xl border border-white/10 bg-[#111] p-6 text-center shadow-2xl shadow-black/20 sm:p-10" role="status">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-400/10 text-lime-300"><CheckCircle2 size={28} aria-hidden="true" /></div>
            <h1 className="mt-5 text-2xl font-bold">Thanks for your feedback</h1>
            <p className="mt-2 text-sm leading-6 text-gray-400">Your verified review for {turfName || "this turf"} has been submitted.</p>
            <Link to="/userBookings" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-lime-400 px-5 text-sm font-bold text-black transition hover:bg-lime-300">Back to bookings</Link>
          </section>
        ) : (
          <section className="mt-6 rounded-3xl border border-white/10 bg-[#111] p-5 shadow-2xl shadow-black/20 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-lime-300">Completed booking</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">How was your visit?</h1>
            <p className="mt-2 text-sm leading-6 text-gray-400">Share an honest review of {turfName || "your turf"}. Your rating helps other players choose with confidence.</p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-6">
              <fieldset>
                <legend className="text-sm font-semibold">Your rating <span className="text-lime-300">*</span></legend>
                <div className="mt-3 flex items-center gap-2" role="group" aria-label="Choose a rating from one to five stars" onMouseLeave={() => setHoverRating(0)}>
                  {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-pressed={rating === value} aria-label={`${value} ${value === 1 ? "star" : "stars"}`} onClick={() => setRating(value)} onMouseEnter={() => setHoverRating(value)} className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400" >
                    <Star size={29} fill={(hoverRating || rating) >= value ? "currentColor" : "none"} className={(hoverRating || rating) >= value ? "text-lime-300" : "text-gray-600"} aria-hidden="true" />
                  </button>)}
                  <span className="ml-2 text-sm text-gray-400" aria-live="polite">{rating ? ["", "Poor", "Fair", "Good", "Very good", "Excellent"][rating] : "Select a rating"}</span>
                </div>
              </fieldset>

              <label className="block text-sm font-semibold" htmlFor="review-comment">Your review <span className="font-normal text-gray-500">(optional)</span>
                <textarea id="review-comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} rows={5} placeholder="What should other players know about the facilities, staff, or overall experience?" className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#0a0a0a] p-3 text-sm font-normal leading-6 text-white outline-none placeholder:text-gray-600 focus:border-lime-400 focus:ring-2 focus:ring-lime-400/15" />
                <span className="mt-1 block text-right text-xs font-normal text-gray-500">{comment.length}/1000</span>
              </label>

              {error && <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200" role="alert">{error}</p>}

              <button type="submit" disabled={submitting || !bookingId || !turfId} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime-400 px-4 text-sm font-bold text-black transition hover:bg-lime-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50">
                {submitting && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}{submitting ? "Submitting review…" : "Submit review"}
              </button>
              <p className="text-center text-xs leading-5 text-gray-500">Reviews can only be submitted for your completed bookings. You can submit one review per booking.</p>
            </form>
          </section>
        )}
      </div>
    </main>
  );
};

export default TurfReview;

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

const TurfReview = () => {
  const [params] = useSearchParams();
  const bookingId = params.get("bookingId");
  const turfId = params.get("turfId");

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || !comment) return alert("Please fill all fields.");

    try {
      setSubmitting(true);

      const res = await axios.post("/api/users/submitReview", {
        bookingId,
        turfId,
        rating,
        comment,
      });

      if (res.data.success) {
        setSubmitted(true);
      } else {
        alert("Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h2 className="text-2xl font-semibold text-green-600">Review submitted successfully! 🎉</h2>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 shadow-lg rounded-xl bg-white">
      <h2 className="text-2xl font-bold mb-6 text-center">Rate Your Turf Experience</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="font-medium">Rating (1-5):</label>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="p-2 border rounded"
        >
          <option value={0}>Select rating</option>
          {[1, 2, 3, 4, 5].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <label className="font-medium">Your Review:</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="How was your experience?"
          className="p-3 border rounded h-28"
        ></textarea>

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
};

export default TurfReview;

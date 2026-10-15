import { useState } from "react";
import { Mail, Phone, SendHorizonal } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    message: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you can use fetch/axios to send the message to backend
    toast.done("Your message has been sent! 📨");
    setFormData({ fullname: "", email: "", message: "" });
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto grid w-full max-w-6xl gap-6 rounded-3xl border border-white/10 bg-gray-900/80 p-5 shadow-2xl shadow-black/20 sm:p-8 md:grid-cols-2 md:gap-8 lg:gap-12 lg:p-10"
      >
        {/* Contact Form */}
        <div>
          <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">
            Let&apos;s Talk
          </h2>
          <p className="mb-6 max-w-prose text-sm leading-6 text-gray-300 sm:text-base">
            Have a question or need help booking a turf or game zone? Send us a message and we’ll get back to you!
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-200">Full Name</label>
              <input
                type="text"
                name="fullname"
                value={formData.fullname}
                onChange={handleChange}
                required
                className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-gray-950 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-200">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-gray-950 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-200">Message</label>
              <textarea
                name="message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                required
                className="mt-1 min-h-36 w-full resize-y rounded-xl border border-white/10 bg-gray-950 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20"
              ></textarea>
            </div>
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 py-3 font-bold text-gray-950 transition hover:bg-lime-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <SendHorizonal size={18} /> Send Message
            </button>
          </form>
        </div>

        <div className="flex flex-col justify-center rounded-2xl border border-lime-300/10 bg-gradient-to-br from-lime-400/10 to-emerald-400/5 p-5 sm:p-7">
          <h3 className="mb-4 text-xl font-bold text-lime-300 sm:text-2xl">For Turf/Game Owners</h3>
          <p className="mb-3 flex min-w-0 items-center gap-3 break-all text-sm text-gray-200 sm:text-base">
            <Phone className="shrink-0 text-lime-400" size={18} /> +91 8999328632
          </p>
          <p className="flex min-w-0 items-center gap-3 break-all text-sm text-gray-200 sm:text-base">
            <Mail className="shrink-0 text-lime-400" size={18} /> admin@gametrack.in
          </p>
          <div className="mt-6 text-sm leading-6 text-gray-400">
            You can reach out for business partnerships, onboarding queries, or feedback.
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default ContactUs;

import React, { useState } from "react";
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
    <section className="min-h-screen bg-gray-100 py-12 px-4 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 bg-white p-8 rounded-2xl shadow-xl"
      >
        {/* Contact Form */}
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Let's Talk 
          </h2>
          <p className="text-gray-600 mb-6">
            Have a question or need help booking a turf or game zone? Send us a message and we’ll get back to you!
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                name="fullname"
                value={formData.fullname}
                onChange={handleChange}
                required
                className="w-full mt-1 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full mt-1 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Message</label>
              <textarea
                name="message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                required
                className="w-full mt-1 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              ></textarea>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200"
            >
              <SendHorizonal size={18} /> Send Message
            </button>
          </form>
        </div>

        <div className="bg-blue-50 p-6 rounded-2xl shadow-inner flex flex-col justify-center">
          <h3 className="text-xl font-semibold text-blue-700 mb-4">For Turf/Game Owners</h3>
          <p className="text-gray-700 mb-2 flex items-center gap-2">
            <Phone className="text-blue-500" size={18} /> +91 8999328632
          </p>
          <p className="text-gray-700 flex items-center gap-2">
            <Mail className="text-blue-500" size={18} /> admin@gametrack.in
          </p>
          <div className="mt-6 text-sm text-gray-600">
            You can reach out for business partnerships, onboarding queries, or feedback.
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default ContactUs;

import React, { useState } from "react";
import axios from "axios";
import { UserPlus, Send, Loader2 } from "lucide-react";

const AddOwner = () => {
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone: "",
    turfIds: "",  // comma-separated string input
    turfname: ""
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Convert comma-separated turfIds string into array
      const payload = {
        ...formData,
        turfIds: formData.turfIds
          .split(",")
          .map(id => id.trim())
          .filter(Boolean),
      };

      const response = await axios.post("/owner/register", payload);
      setMessage("Owner added successfully ✅");
      setFormData({
        fullname: "",
        email: "",
        phone: "",
        turfIds: "",
        turfname: ""
      });
    } catch (error) {
      console.error(error.response);
      setMessage("Error adding owner ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 flex items-center text-lime-400">
          <UserPlus className="mr-2" />
          Add Turf Owner
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {["fullname", "email", "phone", "turfIds", "turfname"].map((field, idx) => (
            <div key={idx}>
              <label className="block text-sm text-gray-300 capitalize mb-1">
                {field === "turfIds" ? "Turf IDs (comma separated)" : field.replace("Id", " ID")}
              </label>
              <input
                type="text"
                name={field}
                value={formData[field]}
                onChange={handleChange}
                className="w-full p-3 bg-gray-800 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm placeholder-gray-500"
                placeholder={`Enter ${field === "turfIds" ? "Turf IDs (e.g. 64a...,65b...)" : field.replace("Id", " ID")}`}
                required
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 flex justify-center items-center bg-lime-500 hover:bg-lime-600 text-black font-semibold rounded-lg transition duration-200"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Send className="mr-2" size={18} /> Add Owner
              </>
            )}
          </button>

          {message && (
            <p
              className={`mt-3 text-sm font-medium ${
                message.includes("✅") ? "text-lime-400" : "text-rose-400"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddOwner;

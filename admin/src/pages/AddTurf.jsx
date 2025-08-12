import React, { useState } from "react";
import axios from "axios";
import {
  MapPin,
  Image as ImageIcon,
  Clock,
  Check,
  X,
  BadgePlus,
  Landmark,
  IndianRupee,
  UserRound,
  Plus,
  Trash2,
  Wifi,
  Droplets,
  ParkingSquare,
  Utensils,
  ShowerHead,
  Lightbulb,
  Lock,
  Star,
  Heart,
  Shield,
  Calendar,
} from "lucide-react";

const AddTurf = () => {
  const [form, setForm] = useState({
    name: "",
    location: {
      address: "",
      city: "",
      pincode: "",
      coordinates: [],
    },
    images: [],
    owner: "",
    dayPrice: "",
    nightPrice: "",
    openingTime: "",
    closingTime: "",
    nightPriceStart: "",
    allowAdvancePayment: "",
    allowFullPaymentOnly: false,
    allowTournaments: false,
    amenities: [],
    sportsAvailable: [],
    bookedSlots: [],
    subscription: [],
    onSitePolicies: [],
  });


  const [amenityInput, setAmenityInput] = useState("");
  const [policyInput, setPolicyInput] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const [sportInput, setSportInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriptionInput, setsubscriptionInput] = useState(
    {
      days: "",
      amount: "",
      description: ""
    }
  )

  const handleAddSport = () => {
    if (sportInput.trim() && !form.sportsAvailable.includes(sportInput.trim())) {
      setForm((prev) => ({
        ...prev,
        sportsAvailable: [...prev.sportsAvailable, sportInput.trim()],
      }));
      setSportInput("");
    }
  };

  const handleAddSubscription = () => {
    if (subscriptionInput.days && subscriptionInput.amount && subscriptionInput.description) {
      setForm((prev) => ({
        ...prev,
        subscription: [...prev.subscription, subscriptionInput]
      }))
    }
  }

  const handleRemoveSport = (index) => {
    setForm((prev) => ({
      ...prev,
      sportsAvailable: prev.sportsAvailable.filter((_, i) => i !== index),
    }));
  };
  const handleRemoveSubscription = (index) => {
    setForm((prev) => ({
      ...prev,
      subscription: prev.subscription.filter((_, i) => i !== index),
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes("location.")) {
      const key = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        location: { ...prev.location, [key]: value },
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files) return;

    const validFiles = files.filter(file => {
      if (!file.type.match('image.*')) {
        setError("Only image files (JPEG, PNG, etc.) are allowed");
        return false;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError("Images must be less than 2MB");
        return false;
      }
      return true;
    });

    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...validFiles],
    }));
  };

  const handleRemoveImage = (index) => {
    const img = form.images[index];
    const isBlobUrl = typeof img === "string" && img.startsWith("blob:");
    if (isBlobUrl) {
      URL.revokeObjectURL(img);
    }
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleAddAmenity = () => {
    if (amenityInput.trim() && !form.amenities.includes(amenityInput.trim())) {
      setForm((prev) => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()],
      }));
      setAmenityInput("");
    }
  };

  const handleRemoveAmenity = (index) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index),
    }));
  };

  const handleAddPolicy = () => {
    if (policyInput.trim() && !form.onSitePolicies.includes(policyInput.trim())) {
      setForm((prev) => ({
        ...prev,
        onSitePolicies: [...prev.onSitePolicies, policyInput.trim()],
      }));
      setPolicyInput("");
    }
  };

  const handleRemovePolicy = (index) => {
    setForm((prev) => ({
      ...prev,
      onSitePolicies: prev.onSitePolicies.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
        dayPrice: Number(form.dayPrice),
        nightPrice: Number(form.nightPrice),
        location: {
          ...form.location,
          coordinates: form.location.coordinates.map(Number),
        },

      };

      const formData = new FormData();
      formData.append("turfData", JSON.stringify(payload));
      form.images.forEach((image) => {
        formData.append("images", image);
      });

      const response = await axios.post("/admin/addTurf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        setForm({
          name: "",
          location: { address: "", city: "", pincode: "", coordinates: [] },
          images: [],
          owner: "",
          dayPrice: "",
          nightPrice: "",
          openingTime: "",
          closingTime: "",
          nightPriceStart:"",
          allowAdvancePayment: "",
          allowFullPaymentOnly: false,
          allowTournaments: false,
          amenities: [],
          sportsAvailable: [],
          bookedSlots: [],
          subscription: [],
          onSitePolicies: [],
        });
        setSuccess("Turf added successfully!");
      } else {
        setError(response.data.message || "Failed to add turf");
      }
    } catch (err) {
      console.log("error", err)
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAmenityIcon = (amenity) => {
    const lowerAmenity = amenity.toLowerCase();
    if (lowerAmenity.includes("wifi")) return <Wifi size={16} />;
    if (lowerAmenity.includes("water")) return <Droplets size={16} />;
    if (lowerAmenity.includes("parking")) return <ParkingSquare size={16} />;
    if (lowerAmenity.includes("food")) return <Utensils size={16} />;
    if (lowerAmenity.includes("shower")) return <ShowerHead size={16} />;
    if (lowerAmenity.includes("light")) return <Lightbulb size={16} />;
    if (lowerAmenity.includes("locker")) return <Lock size={16} />;
    return <Plus size={16} />;
  };

  const subscriptionOptions = ["Free", "Basic", "Pro", "Enterprise"];

  return (
    <div className="max-w-6xl mx-auto my-8 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
      <div className="bg-gradient-to-r from-green-600 to-green-800 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BadgePlus size={28} className="text-white" />
            <h1 className="text-2xl font-bold">Add New Turf Facility</h1>
          </div>
          <div className="bg-green-800/30 px-3 py-1 rounded-full text-sm font-medium">
            Turf Management
          </div>
        </div>
        <p className="mt-2 text-green-100">
          Fill in the details to register a new turf in our system
        </p>
      </div>

      <div className="border-b border-gray-200 overflow-scroll md:overflow-hidden">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab("basic")}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === "basic"
              ? "border-green-500 text-green-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            Basic Information
          </button>
          <button
            onClick={() => setActiveTab("location")}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === "location"
              ? "border-green-500 text-green-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            Location Details
          </button>
          <button
            onClick={() => setActiveTab("pricing")}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === "pricing"
              ? "border-green-500 text-green-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            Pricing & Timings
          </button>
          <button
            onClick={() => setActiveTab("media")}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === "media"
              ? "border-green-500 text-green-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            Media & Features
          </button>
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <div className="flex items-center text-red-700">
              <X className="mr-2" size={18} />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
            <div className="flex items-center text-green-700">
              <Check className="mr-2" size={18} />
              <span className="font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Basic Info Section */}
        {(activeTab === "basic" || !activeTab) && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Turf Name <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Landmark size={18} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    placeholder="Turf Name"
                    value={form.name}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner ID <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <UserRound size={18} />
                  </div>
                  <input
                    type="text"
                    name="owner"
                    placeholder="Owner ID"
                    value={form.owner}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subscription Plan
                </label>

                <div className="flex w-full gap-x-2 mb-1" >
                  <input type="Number" className=" outline p-2 rounded-xl  h-15 " value={subscriptionInput.days} onChange={(e) => setsubscriptionInput((prev) => ({ ...prev, days: e.target.value }))} placeholder="Ex. 15, 30, 45 Days" />
                  <input type="Number" className=" outline px-2 rounded-xl  h-15" value={subscriptionInput.amount} onChange={(e) => setsubscriptionInput((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter the amount" />
                </div>
                <input type="text" className=" p-2 rounded-xl w-full h-20" value={subscriptionInput.description} onChange={(e) => setsubscriptionInput((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter the Descrption ..." />
                <button
                  type="button"
                  onClick={handleAddSubscription}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add Subscription
                </button>


              </div>
              {form.subscription.length > 0 && (
                <div className="mt-4">
                  {form.subscription.map((sub, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-100 p-3 rounded mb-2">
                      <div>
                        <p className="text-sm font-semibold">{sub.days} Days - ₹{sub.amount}</p>
                        <p className="text-xs text-gray-600">{sub.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubscription(i)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Payment Options
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="Number"
                    name="allowAdvancePayment"
                    value={form.allowAdvancePayment}
                    onChange={handleChange}
                    placeholder="₹ 100"
                    className="h-8 w-20 p-2 outline-1 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                     Advance Payment (₹)
                  </span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="allowFullPaymentOnly"
                    checked={form.allowFullPaymentOnly}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Full Payment Only
                  </span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="allowTournaments"
                    checked={form.allowTournaments}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Allow Tournaments
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Location Section */}
        {activeTab === "location" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <MapPin size={18} />
                </div>
                <input
                  name="location.address"
                  placeholder="Full street address"
                  value={form.location.address}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  name="location.city"
                  placeholder="City"
                  value={form.location.city}
                  onChange={handleChange}
                  className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  name="location.pincode"
                  placeholder="Postal code"
                  value={form.location.pincode}
                  onChange={handleChange}
                  className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GPS Coordinates
              </label>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  <MapPin size={16} className="mr-1" /> Lat,Long
                </span>
                <input
                  name="location.coordinates"
                  placeholder="e.g. 74.25,18.55"
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      location: {
                        ...prev.location,
                        coordinates: e.target.value.split(","),
                      },
                    }))
                  }
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Optional: Provide latitude and longitude separated by comma for
                precise location
              </p>
            </div>
          </div>
        )}

        {/* Pricing & Timings Section */}
        {activeTab === "pricing" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Day Price (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <IndianRupee size={16} />
                  </div>
                  <input
                    name="dayPrice"
                    type="number"
                    placeholder="Price per hour during day"
                    value={form.dayPrice}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Night Price (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <IndianRupee size={16} />
                  </div>
                  <input
                    name="nightPrice"
                    type="number"
                    placeholder="Price per hour during night"
                    value={form.nightPrice}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </div>



            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opening Time <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Clock size={16} />
                  </div>
                  <input
                    type="time"
                    name="openingTime"
                    value={form.openingTime}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Night Price Start Time <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Clock size={16} />
                  </div>
                  <input
                    type="time"
                    name="nightPriceStart"
                    value={form.nightPriceStart}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Time when night pricing begins (usually 6PM or 7PM)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Closing Time <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Clock size={16} />
                  </div>
                  <input
                    type="time"
                    name="closingTime"
                    value={form.closingTime}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Operating Hours Preview
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {form.openingTime && form.closingTime ? (
                  <div className="flex items-center justify-center space-x-2">
                    <span className="font-medium text-gray-700">
                      {form.openingTime} - {form.closingTime}
                    </span>
                    <span className="text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs">
                      {parseInt(form.closingTime.split(":")[0]) -
                        parseInt(form.openingTime.split(":")[0])}{" "}
                      hours
                    </span>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center">
                    Set opening and closing times to see operating hours
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Media & Features Section */}
        {activeTab === "media" && (
          <div className="space-y-8">
            {/* Images Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Turf Images <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  multiple
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-green-50 file:text-green-700
                    hover:file:bg-green-100"
                />
                {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
              </div>

              {form.images.length > 0 && (
                <div className="mt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                    {form.images.map((img, i) => (
                      <div
                        key={i}
                        className="relative group rounded-lg overflow-hidden border border-gray-200 h-36 sm:h-40"
                      >
                        <img
                          src={typeof img === "string" ? img : URL.createObjectURL(img)}
                          alt={`Turf preview ${i + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/300x200?text=Image+Error";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full z-20 opacity-90 md:group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="text-white text-xs truncate">Image {i + 1}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {form.images.length} image{form.images.length !== 1 ? "s" : ""} added
                    {form.images.length > 3 && " (maximum 3 recommended)"}
                  </p>
                </div>
              )}
            </div>

            {/* Sports Section */}
            <div className="pt-6 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sports Available <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add sports (e.g., Football, Cricket)"
                  value={sportInput}
                  onChange={(e) => setSportInput(e.target.value)}
                  className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <button
                  type="button"
                  onClick={handleAddSport}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="mr-1" size={16} /> Add
                </button>
              </div>

              {form.sportsAvailable.length > 0 && (
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {form.sportsAvailable.map((sport, i) => (
                      <div
                        key={i}
                        className="inline-flex items-center bg-green-50 text-green-800 rounded-full py-1 px-3 text-sm"
                      >
                        <span>{sport}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSport(i)}
                          className="ml-2 text-green-500 hover:text-green-700"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Amenities Section */}
            <div className="pt-6 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amenities & Facilities
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add amenities (e.g., Drinking Water, Parking)"
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <button
                  type="button"
                  onClick={handleAddAmenity}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="mr-1" size={16} /> Add
                </button>
              </div>

              {form.amenities.length > 0 && (
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {form.amenities.map((item, i) => (
                      <div
                        key={i}
                        className="inline-flex items-center bg-blue-50 text-blue-800 rounded-full py-1 px-3 text-sm"
                      >
                        {getAmenityIcon(item)}
                        <span className="ml-1">{item}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAmenity(i)}
                          className="ml-2 text-blue-500 hover:text-blue-700"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>


            <div className="pt-6 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                On-Site Policies
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add policies (e.g., No smoking, Proper footwear required)"
                  value={policyInput}
                  onChange={(e) => setPolicyInput(e.target.value)}
                  className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <button
                  type="button"
                  onClick={handleAddPolicy}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="mr-1" size={16} /> Add
                </button>
              </div>

              {form.onSitePolicies.length > 0 && (
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {form.onSitePolicies.map((policy, i) => (
                      <div
                        key={i}
                        className="inline-flex items-center bg-purple-50 text-purple-800 rounded-full py-1 px-3 text-sm"
                      >
                        <Shield size={14} className="mr-1" />
                        <span>{policy}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePolicy(i)}
                          className="ml-2 text-purple-500 hover:text-purple-700"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-gray-200 flex justify-between">
          {activeTab !== "basic" && (
            <button
              type="button"
              onClick={() => {
                const tabs = ["basic", "location", "pricing", "media"];
                const currentIndex = tabs.indexOf(activeTab);
                setActiveTab(tabs[currentIndex - 1]);
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Previous
            </button>
          )}

          {activeTab !== "media" ? (
            <button
              type="button"
              onClick={() => {
                const tabs = ["basic", "location", "pricing", "media"];
                const currentIndex = tabs.indexOf(activeTab);
                setActiveTab(tabs[currentIndex + 1]);
              }}
              className="ml-auto inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className={`ml-auto inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <Check className="mr-2" size={18} />
                  Submit Turf Details
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddTurf;
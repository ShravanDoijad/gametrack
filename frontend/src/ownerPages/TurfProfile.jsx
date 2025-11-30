import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { BookContext } from "../constexts/bookContext";

const TurfProfile = () => {
  const { selectedTurfId } = useContext(BookContext);

  const [turf, setTurf] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // EDIT FORM
  const [editData, setEditData] = useState({});

  // SUBSCRIPTION FORM
  const [subscriptionInput, setSubscriptionInput] = useState({
    days: "",
    amount: "",
    description: ""
  });

  useEffect(() => {
    const getTurf = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/owner/turfDetails?turfId=${selectedTurfId}`);
        setTurf(res.data.turf);
        setEditData(res.data.turf);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (selectedTurfId) getTurf();
  }, [selectedTurfId]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubscriptionChange = (e) => {
    const { name, value } = e.target;
    setSubscriptionInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubscription = async () => {
    if (!subscriptionInput.days || !subscriptionInput.amount) {
      alert("Days and Amount are required!");
      return;
    }

    console.log("Subscription Payload:", subscriptionInput);

    await axios.post("/api/turfs/add-subscription", {
      ...subscriptionInput,
      turfId: selectedTurfId
    });

    setSubscriptionInput({ days: "", amount: "", description: "" });
    setShowSubscriptionModal(false);
  };

  const handleUpdateTurf = async () => {
    try {
      await axios.put(`/owner/updateTurfProfile`, editData);
      setTurf(editData);
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  const renderChips = (arr) =>
    arr?.length > 0 ? (
      <div className="flex flex-wrap gap-2 mt-2">
        {arr.map((item, i) => (
          <span
            key={i}
            className="px-3 py-1 text-xs rounded-full bg-gray-800 border border-gray-700"
          >
            {item}
          </span>
        ))}
      </div>
    ) : (
      <p className="text-gray-500 mt-1">None</p>
    );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-300">
        Loading Turf Profile...
      </div>
    );
  }

  if (!turf) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-red-500">
        Turf Not Found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{turf.name}</h1>
            <p className="text-gray-400 mt-1">
              {turf.location?.address}, {turf.location?.city}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="px-5 py-2.5 border border-gray-700 hover:bg-gray-800 rounded-lg"
            >
              Edit Turf
            </button>

            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="px-6 py-2.5 bg-lime-500 hover:bg-lime-400 text-black rounded-lg font-semibold"
            >
              + Add Subscription
            </button>
          </div>
        </div>

        {/* IMAGE + MAIN */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <img
            src={turf.images?.[0]}
            alt="turf"
            className="rounded-xl w-full h-72 object-cover border border-gray-800"
          />

          <div className="grid grid-cols-2 gap-5">
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
              <p className="text-gray-400 text-sm">Day Price</p>
              <p className="text-xl mt-1 font-bold">₹ {turf.dayPrice}</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
              <p className="text-gray-400 text-sm">Night Price</p>
              <p className="text-xl mt-1 font-bold">₹ {turf.nightPrice}</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
              <p className="text-gray-400 text-sm">Opening</p>
              <p className="text-lg mt-1">{turf.openingTime}</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
              <p className="text-gray-400 text-sm">Closing</p>
              <p className="text-lg mt-1">{turf.closingTime}</p>
            </div>
          </div>
        </div>

        {/* CHIPS SECTION */}
        <div className="grid md:grid-cols-3 gap-6">

          <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
            <h3 className="font-semibold">Sports Available</h3>
            {renderChips(turf.sportsAvailable)}
          </div>
          <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
            <p className="text-gray-400 text-sm">Night Price Start</p>
            <p className="text-lg mt-1">{turf.nightPriceStart}</p>
          </div>

          {/* Full Location */}
          <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl col-span-2">
            <p className="text-gray-400 text-sm">Full Location</p>
            <p className="text-lg mt-1">
              {turf.location?.address}, {turf.location?.city} - {turf.location?.pincode}
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
            <h3 className="font-semibold">Amenities</h3>
            {renderChips(turf.amenities)}
          </div>

          <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
            <h3 className="font-semibold">Policies</h3>
            {renderChips(turf.onSitePolicies)}
          </div>

        </div>
      </div>

      {/* ADD SUBSCRIPTION MODAL */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">Add Subscription</h2>

            <input
              type="text"
              name="days"
              placeholder="Days (Mon - Fri)"
              value={subscriptionInput.days}
              onChange={handleSubscriptionChange}
              className="w-full p-2 mb-3 bg-gray-800 border border-gray-700 rounded"
            />

            <input
              type="number"
              name="amount"
              placeholder="Amount"
              value={subscriptionInput.amount}
              onChange={handleSubscriptionChange}
              className="w-full p-2 mb-3 bg-gray-800 border border-gray-700 rounded"
            />

            <textarea
              name="description"
              placeholder="Description"
              value={subscriptionInput.description}
              onChange={handleSubscriptionChange}
              className="w-full p-2 mb-4 bg-gray-800 border border-gray-700 rounded"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="px-4 py-2 bg-gray-700 rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleAddSubscription}
                className="px-4 py-2 bg-lime-500 text-black rounded font-semibold"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TURF MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">Edit Turf</h2>

            <input
              type="text"
              name="name"
              value={editData.name}
              onChange={handleEditChange}
              className="w-full p-2 mb-3 bg-gray-800 border border-gray-700 rounded"
            />

            <input
              type="number"
              name="dayPrice"
              value={editData.dayPrice}
              onChange={handleEditChange}
              className="w-full p-2 mb-3 bg-gray-800 border border-gray-700 rounded"
            />

            <input
              type="number"
              name="nightPrice"
              value={editData.nightPrice}
              onChange={handleEditChange}
              className="w-full p-2 mb-4 bg-gray-800 border border-gray-700 rounded"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-700 rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdateTurf}
                className="px-4 py-2 bg-lime-500 text-black rounded font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TurfProfile;

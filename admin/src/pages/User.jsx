import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { User as UserIcon, Phone, Calendar, Star } from "lucide-react";

const User = () => {
  const location = useLocation();
  const [users, setUsers] = useState(location.state?.users || []);

  if (users.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
          <div className="animate-spin rounded-full border-8 border-t-blue-500 border-gray-200 h-20 w-20 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800">Loading</h2>
          <p className="text-gray-600 mt-2">Please wait while we load users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">All Users</h2>

      {/* Users Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <div
            key={user._id}
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition"
          >
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <UserIcon className="text-blue-600 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  {user.fullname}
                </h3>
                <p className="text-sm text-gray-500">ID: {user._id.slice(-6)}</p>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-3 text-gray-700">
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-600" /> {user.phone}
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />{" "}
                {new Date(user.registeredAt).toLocaleDateString()}
              </p>
              <p className="flex items-center gap-2">
                <Star
                  className={`w-4 h-4 ${
                    user.favoriteTurfs?.length > 0
                      ? "text-yellow-500"
                      : "text-gray-400"
                  }`}
                />{" "}
                {user.favoriteTurfs?.length > 0
                  ? `${user.favoriteTurfs.length} favorite turf(s)`
                  : "No favorites"}
              </p>
            </div>

            {/* Footer */}
            <div className="mt-4">
              <span
                className={`px-3 py-1 text-sm rounded-full ${
                  user.preferences?.notifyOnBooking
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {user.preferences?.notifyOnBooking
                  ? "Notifications ON"
                  : "Notifications OFF"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default User;

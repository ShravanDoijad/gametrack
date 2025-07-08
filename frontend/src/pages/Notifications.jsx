import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CheckCircle,
  XCircle,
  TicketPercent,
  Clock,
  BellRing,
} from "lucide-react";

export const Notifications = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);

  const askForPermission = async () => {
    const OneSignal = window._oneSignalInstance;
    if (!OneSignal) {
      console.warn("OneSignal SDK not yet ready, retrying...");
      setTimeout(askForPermission, 2000);
      return;
    }

    try {
      const permission = await OneSignal.Notifications.requestPermission();
      console.log("Permission result:", permission);
      setIsSubscribed(permission === "granted");
    } catch (err) {
      console.error("Permission error:", err);
    }
  };

  const getPlayerId = async () => {
    const OneSignal = window._oneSignalInstance;
    if (!OneSignal) {
      console.warn("OneSignal not ready yet, retrying...");
      setTimeout(getPlayerId, 2000);
      return;
    }

    try {
        const userId = await OneSignal.client.getUserId();
    console.log("OneSignal Player ID:", userId);


      // Optional: Save to backend
      await axios.post("/api/users/updateUser", {
        playerId: userId,
      });
    } catch (err) {
      console.error("Error getting player ID:", err);
    }
  };

  useEffect(() => {
    getPlayerId();
  }, []);

  const notifications = [
    {
      type: "success",
      message: "Booking Successful",
      detail: "Your turf booking at TurboTurf for 7:00 PM today is confirmed!",
      time: "Today · 6:45 PM",
    },
    {
      type: "cancel",
      message: "Booking Cancelled",
      detail: "Your booking at Prime Arena was cancelled due to unavailability.",
      time: "Today · 4:30 PM",
    },
    {
      type: "offer",
      message: "Limited Time Offer!",
      detail: "Get 30% OFF on all turf bookings between 3 PM - 6 PM today!",
      time: "Valid Today Only",
    },
    {
      type: "reminder",
      message: "Match Reminder",
      detail: "Your match at PlayZone starts in 30 mins. Be ready!",
      time: "Today · 6:30 PM",
    },
  ];

  const iconMap = {
    success: <CheckCircle className="text-green-400 w-6 h-6" />,
    cancel: <XCircle className="text-red-400 w-6 h-6" />,
    offer: <TicketPercent className="text-yellow-400 w-6 h-6" />,
    reminder: <Clock className="text-blue-400 w-6 h-6" />,
  };

  const cardStyles = {
    success: "border-green-500/30 bg-black/30 border",
    cancel: "border-red-500/30 bg-black/30 border",
    offer: "border-yellow-500/30 bg-black/30 border",
    reminder: "border-blue-500/30 bg-black/30 border",
  };

  const highlightMainWords = (text) => {
    const keywords = [
      "Successful",
      "Cancelled",
      "OFF",
      "Reminder",
      "confirmed",
      "unavailability",
      "TurboTurf",
      "Prime Arena",
      "PlayZone",
    ];
    const regex = new RegExp(`(${keywords.join("|")})`, "gi");

    return text.split(regex).map((part, index) =>
      keywords.some((word) => word.toLowerCase() === part.toLowerCase()) ? (
        <span key={index} className="font-bold text-white">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Notifications</h1>

        <div className="flex justify-between items-center mb-4 bg-gray-800 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <BellRing className="text-yellow-300" />
            <span className="text-sm">Push Notifications</span>
          </div>
          <button
            className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition"
            onClick={askForPermission}
          >
            {isSubscribed ? "Permission Granted" : "Enable Alerts"}
          </button>
        </div>

        <div className="space-y-4">
          {notifications.map((item, index) => (
            <div
              key={index}
              className={`relative flex items-start gap-4 p-5 rounded-2xl ${cardStyles[item.type]} transition hover:scale-[1.02] hover:shadow-lg`}
            >
              <div className="shrink-0 mt-1.5">{iconMap[item.type]}</div>

              <div className="flex-1">
                <h2 className="font-semibold text-lg mb-1">{item.message}</h2>
                <p className="text-gray-300 text-sm mb-2">
                  {highlightMainWords(item.detail)}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {item.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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

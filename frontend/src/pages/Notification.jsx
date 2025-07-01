import React from "react";
import {
  CheckCircle,
  XCircle,
  TicketPercent,
  Clock,
} from "lucide-react";

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
  success: <CheckCircle className="text-green-500 w-6 h-6" />,
  cancel: <XCircle className="text-red-500 w-6 h-6" />,
  offer: <TicketPercent className="text-yellow-500 w-6 h-6" />,
  reminder: <Clock className="text-blue-500 w-6 h-6" />,
};

const cardStyles = {
  success: "border-green-500/30 bg-green-50 dark:bg-green-900/30 dark:border-green-500/40",
  cancel: "border-red-500/30 bg-red-50 dark:bg-red-900/30 dark:border-red-500/40",
  offer: "border-yellow-500/30 bg-yellow-50 dark:bg-yellow-900/30 dark:border-yellow-500/40",
  reminder: "border-blue-500/30 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500/40",
};

export const Notification = () => {
  return (
    <div className="min-h-screen  p-6 transition-colors duration-300">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Notifications</h1>

      <div className="space-y-4">
        {notifications.map((item, index) => (
          <div
            key={index}
            className={`relative flex items-start gap-4 p-5 rounded-2xl border shadow-md dark:shadow-lg ${cardStyles[item.type]}`}
          >
            <div className="shrink-0 mt-1.5">{iconMap[item.type]}</div>

            <div className="flex-1">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                {item.message}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                {highlightMainWords(item.detail)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const highlightMainWords = (text) => {
  const keywords = ["Successful", "Cancelled", "OFF", "Reminder", "confirmed", "unavailability"];
  const regex = new RegExp(`(${keywords.join("|")})`, "gi");

  return text.split(regex).map((part, index) =>
    keywords.some((word) => word.toLowerCase() === part.toLowerCase()) ? (
      <span key={index} className="font-semibold text-black dark:text-white underline">
        {part}
      </span>
    ) : (
      part
    )
  );
};

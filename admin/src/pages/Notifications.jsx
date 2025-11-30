import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { BookContext } from "../constexts/bookContext";
import {
  CheckCircle,
  XCircle,
  TicketPercent,
  Clock,
  BellRing,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { requestPermission } from "../firebase-messaging"

export const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const { userInfo } = useContext(BookContext);

  useEffect(() => {
    if (!userInfo) return;

    const fetchNotifications = async () => {
      try {
        const response = await axios.get("/api/users/getNotfications");
        setNotifications(response.data.notifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
  }, [userInfo]);

  const iconMap = {
    success: <CheckCircle className="text-green-400 w-5 h-5" />,
    cancel: <XCircle className="text-red-400 w-5 h-5" />,
    offer: <TicketPercent className="text-yellow-400 w-5 h-5" />,
    reminder: <Clock className="text-blue-400 w-5 h-5" />,
    booking: <BellRing className="text-cyan-400 w-5 h-5" />,
  };

  const cardStyles = {
    success: "border-green-500/30 bg-black/30 border",
    cancel: "border-red-500/30 bg-black/30 border",
    offer: "border-yellow-500/30 bg-black/30 border",
    reminder: "border-blue-500/30 bg-black/30 border",
    booking: "border-cyan-500/30 bg-black/30 border",
  };

  const highlightMainWords = (text) => {
    if (!text) return null;

    const keywords = [
      "Successful",
      "Cancelled",
      "OFF",
      "Reminder",
      "confirmed",
      "unavailability",
      "GameTrack",
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white px-6  sans">
      <div className="max-w-2xl mx-auto">


        <h1 className="text-3xl font-bold mb-6 sora">Notifications</h1>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20">
            <BellRing className="w-12 h-12 text-gray-500 mb-4" />
            <p className="text-gray-400 text-center text-sm font-medium">
              You're all caught up!<br />No new notifications right now.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((item, index) => (
              <div
                key={index}
                className={`relative flex items-start gap-4 p-4 rounded-xl ${cardStyles[item.type] || "bg-black/20 border border-gray-700"
                  } transition hover:scale-[1.01] hover:shadow-md`}
              >
                <div className="shrink-0 mt-1.5">
                  {iconMap[item.type] || <BellRing className="text-white w-5 h-5" />}
                </div>

                <div className="flex-1 text-sm">
                  <h2 className="font-semibold text-base mb-1 font-sora text-white">
                    {item.title}
                  </h2>
                  <p className="text-gray-300 text-sm mb-2">
                    {highlightMainWords(item.message)}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

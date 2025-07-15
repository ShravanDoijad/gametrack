// src/components/FirebasePush.jsx
import { useEffect } from "react";
import { requestPermission, onMessageListener } from "../firebase-messaging";
import axios from "axios";

const PushNotifier = ({ userId, ownerId, type }) => {
  useEffect(() => {
    requestPermission().then((token) => {
       if (token) {
        console.log("📡 FCM Token:", token);
        if (type === "user") {
          axios.post("/api/users/updateUser", {
            userId,
            playerId: token,
          });
        } else if (type === "owner") {
          axios.post("/api/owners/updateOwner", {
            ownerId,
            playerId: token,
          });
        }
      }
      else {
        console.warn("❌ No FCM token received");
      }
    });

    onMessageListener().then((payload) => {
      console.log("📬 Foreground notification received:", payload);
      const { title, body } = payload.notification;

      new Notification(title, {
        body: body,
        icon: "/favicon.ico", 
      });
    });
  }, []);

  return null;
};

export default PushNotifier;

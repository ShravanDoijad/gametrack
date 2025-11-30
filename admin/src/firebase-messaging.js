// src/firebase-messaging.js
import { getMessaging, getToken, onMessage, deleteToken } from "firebase/messaging";
import firebaseApp from "./firebase";

const messaging = getMessaging(firebaseApp);

export const requestPermission = async () => {
  console.log("🔔 Requesting notification permission...");
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_VAPID_KEY,
      });
      console.log("✅ Token received:", token);
      return token;
    } else {
      console.warn("❌ Notification permission denied or blocked:", permission);
      return null;
    }
  } catch (err) {
    console.error("🔥 Permission request failed:", err);
    return null;
  }
};



export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

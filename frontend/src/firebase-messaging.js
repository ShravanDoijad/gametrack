// src/firebase-messaging.js
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import firebaseApp from "./firebase";

const messaging = getMessaging(firebaseApp);

export const requestPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: process.env.VITE_VAPID_KEY, 
      });
      console.log("✅ FCM Token:", token);
      
      return token;
    } else {
      console.warn("❌ Notification permission denied");
    }
  } catch (err) {
    console.error("🔥 Token Error", err);
  }
};


export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

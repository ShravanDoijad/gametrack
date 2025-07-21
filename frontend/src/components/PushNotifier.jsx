import { useEffect } from "react";
import { requestPermission, onMessageListener } from "../firebase-messaging";
import axios from "axios";
import  notificationIcon from "../assets/logo-192.png"
const PushNotifier = ({ userId, ownerId, type }) => {
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const token = await requestPermission();

        if (!token) {
          console.warn("❌ No FCM token received");
          return;
        }

        console.log("Received FCM token:", token);

        if (type === "user" && userId) {
          await axios.post("/api/users/updateUser", {
            userId,
            fcmToken: token,
          });
          console.log("User FCM token updated");
        } else if (type === "owner" && ownerId) {
          await axios.post("/owner/updateOwner", {
            ownerId,
            fcmToken: token,
          });
          console.log("Owner FCM token updated");
        }
      } catch (err) {
        console.error("Push setup error:", err);
      }
    };

    setupNotifications();

    onMessageListener().then((payload) => {
      console.log(" Foreground notification received:", payload);
      const { title, body } = payload.notification;

      new Notification(title, {
        body,
        
        icon: {notificationIcon}, 
        badge: "/icons/logo-96.png",
       
      })
    });
  }, [userId, ownerId, type]);

  return null; 
};

export default PushNotifier;

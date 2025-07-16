import { useEffect } from "react";
import { requestPermission, onMessageListener } from "../firebase-messaging";
import axios from "axios";

const PushNotifier = ({ userId, ownerId, type }) => {
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // ✅ Always ask for permission, regardless of role
        const token = await requestPermission();

        if (!token) {
          console.warn("❌ No FCM token received");
          return;
        }

        console.log("📡 FCM Token:", token);

        // ✅ Now update based on the type
        if (type === "user" && userId) {
          await axios.post("/api/users/updateUser", {
            userId,
            fcmToken: token,
          });
          console.log("✅ User FCM token updated");
        } else if (type === "owner" && ownerId) {
          await axios.post("/owner/updateOwner", {
            ownerId,
            fcmToken: token,
          });
          console.log("✅ Owner FCM token updated");
        }
      } catch (err) {
        console.error("🔥 Push setup error:", err);
      }
    };

    setupNotifications();

    // ✅ Listen for foreground notifications
    onMessageListener().then((payload) => {
      console.log("📬 Foreground notification received:", payload);
      const { title, body } = payload.notification;

      new Notification(title, {
        body,
        icon: "/GameTrack.jpg",
      });
    });
  }, [userId, ownerId, type]);

  return null;
};

export default PushNotifier;

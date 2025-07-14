import { useEffect } from 'react';
import axios from 'axios';

const OneSignalInit = ({ userId }) => {
  useEffect(() => {
    const waitForOneSignal = setInterval(() => {
      const OneSignal = window._oneSignalInstance;
      if (!OneSignal) {
        console.log("⏳ Waiting for OneSignal...");
        return;
      }

      clearInterval(waitForOneSignal);
      console.log("✅ OneSignal is ready", OneSignal);

      // Ask for permission (it doesn’t return a value)
      OneSignal.Notifications.requestPermission();

      // Wait a little to make sure permission is updated
      setTimeout(async () => {
        const permission = await OneSignal.Notifications.permission;
        console.log("🔔 OneSignal Permission:", permission); // expected: 'granted'

        if (permission) {
          OneSignal.Notifications.addEventListener("subscriptionChange", async (event) => {
            const playerId = event.subscription?.id;

            if (!playerId) {
              console.warn("⚠️ No Player ID in subscriptionChange.");
              return;
            }

            console.log("✅ Player ID:", playerId);

            try {
              await axios.post("/api/users/updateUser", {
                userId,
                playerId,
              });
              console.log("📡 Player ID sent to backend.");
            } catch (err) {
              console.error("❌ Failed to send Player ID:", err);
            }
          });
        } else {
          console.warn("🔕 Push permission not granted.");
        }
      }, 1000);
    }, 1000);
  }, [userId]);

  return null;
};

export default OneSignalInit;

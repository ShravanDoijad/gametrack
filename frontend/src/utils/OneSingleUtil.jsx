import { useEffect } from 'react';
import axios from 'axios';

const OneSignalInit = ({ userId }) => {
  useEffect(() => {
    const waitForOneSignal = setInterval(async () => {
      const OneSignal = window._oneSignalInstance;
      if (!OneSignal) {
        console.log("⏳ Waiting for OneSignal...");
        return;
      }

      clearInterval(waitForOneSignal);
      console.log("✅ OneSignal is ready", OneSignal);

      const permission = OneSignal.Notifications.permission;
      console.log("🔔 OneSignal Permission:", permission);

      if (permission ) {
        const playerId = await OneSignal.getUserId();
        console.log("✅ Player ID:", playerId);

        await axios.post("/api/users/updateUser", {
          userId,
          playerId,
        });
      } else {
        console.warn("🔕 Push not granted");
      }
    }, 1000);
  }, [userId]);

  return null;
};


export default OneSignalInit;

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

      const permission = await OneSignal.Notifications.permission;
      if (permission === "granted") {
        const user = await OneSignal.User.get();
        console.log("✅ Player ID:", user.id);

        await axios.post("/api/users/updateUser", {
          userId,
          playerId: user.id,
        });
      } else {
        console.warn("🔕 Push not granted");
      }
    }, 1000);
  }, [userId]);
    return null;
};

export default OneSignalInit;

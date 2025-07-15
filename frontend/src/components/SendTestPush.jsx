import axios from "axios";
import { useState } from "react";

const SendTestPush = ({ playerToken }) => {
    const [loading, setloading] = useState(false)
  const sendPushNotification = async () => {
    setloading(true)
    try {
        
      const res = await axios.post("/api/users/send-push", {
        token: playerToken,
        title: "🚀 Hello Shravan!",
        body: "Your push is working perfectly!",
      });

      console.log("✅ Push response:", res.data);
    } catch (err) {
      console.error("❌ Error sending push:", err);
    }
    finally{
        setloading(false)
    }
  };


    
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-b from-gray-900 to-gray-950">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-400 mb-4"></div>
                    <p className="text-cyan-100 font-sora text-lg">Loading ...</p>
                </div>
            </div>
        );
    }



  return (
    <button
      onClick={sendPushNotification}
      className="bg-blue-500 text-white px-4 py-2 rounded"
    >
      Send Test Notification
    </button>
  );
};

export default SendTestPush;

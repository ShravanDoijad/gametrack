
const Notification = require('../models/notification-model');
const User = require('../models/user-model')


const saveFcm =  async (req, res) => {
  try {
     const { userId, fcmToken } = req.body;

  if (!userId || !fcmToken) {
    return res.status(400).json({ message: "Missing fields" });
  }

  await User.findByIdAndUpdate(userId, { fcmToken: fcmToken });
  res.status(200).json({ message: "Token saved" });
  } catch (error) {
    console.log("Can not Save the Token", error)
    res.json({message:"Error in saving the Token", error:error})
  }
}


const createNotification = async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;

    if (!userId || !title || !message || !type) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
    });

     const user = await User.findById(userId);
    if (!user || !user.fcmToken) {
      return res.status(404).json({ success: false, message: "User not found or no FCM token." });
    }

    
    const payload = {
      notification: {
        title: title,
        body: message,
      },
      data: {
        type: type,
      },
      token: user.fcmToken,
    };

    await admin.messaging().send(payload);

    return res.status(201).json({
      success: true,
      message: "Notification created and sent successfully.",
      notification,
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {createNotification, saveFcm}

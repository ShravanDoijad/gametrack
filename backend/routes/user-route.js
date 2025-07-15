const express = require('express');
const { body } = require('express-validator');
const userRouter = express.Router();

const { userRegister, userLogout, createOrder, verifyOrder, getAllBookings, updateUser, deleteUser, addFavorite, getFavoriteTurfs, login, removeFavoriteTurf } = require('../controllers/user-controller');
const {userOrOwnerMiddleware} = require("../middleware/authMiddleware")
const admin = require("firebase-admin");
const serviceAccount = require("../gametrack-key.json");

userRouter.post(
  "/userRegister",
  [
    body("phone")
      .optional()
      .isMobilePhone("en-IN")
      .withMessage("Enter a valid Indian phone number"),

    body("email")
      .optional()
      .isEmail()
      .withMessage("Enter a valid email"),

    body("fullname")
      .optional()
      .isLength({ min: 3 })
      .withMessage("Full name must be at least 3 characters"),

    body()
      .custom((value) => {
        if (!value.phone && !value.email) {
          throw new Error("Either phone or email is required");
        }
        return true;
      }),
  ],
  userRegister
);

userRouter.post(
  "/login",
  [
    body("phone")
      .optional()
      .isMobilePhone("en-IN")
      .withMessage("Enter a valid Indian phone number"),

    body("email")
      .optional()
      .isEmail()
      .withMessage("Enter a valid email"),

    body("password")
      .notEmpty()
      .withMessage("Password is required"),
  ],
  login
);

userRouter.post("/createOrder", userOrOwnerMiddleware,createOrder );
userRouter.post("/verifyPayment", userOrOwnerMiddleware, verifyOrder );
userRouter.get("/allBookings", userOrOwnerMiddleware, getAllBookings);
userRouter.post("/updateUser", userOrOwnerMiddleware, updateUser);
userRouter.post("/addFavorite", userOrOwnerMiddleware, addFavorite);
userRouter.get("/getFavoriteTurfs", userOrOwnerMiddleware, getFavoriteTurfs);
userRouter.post("/deleteUser", userOrOwnerMiddleware, deleteUser);
userRouter.post("/removeFavoriteTurf", userOrOwnerMiddleware, removeFavoriteTurf);


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

userRouter.post("/send-push", async (req, res) => {
  const { token, title, body } = req.body;

  if (!token) return res.status(400).json({ error: "FCM token is missing" });

  const message = {
    token,
    notification: {
      title,
      body,
    },
    webpush: {
      notification: {
        icon: "/logo192.png",
        click_action: "https://localhost:5173", // change to your prod domain
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    return res.json({ success: true, response });
  } catch (error) {
    console.error("❌ Error sending push:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

userRouter.post('/userLogout', userLogout);

module.exports = userRouter;

const express = require('express');
const { body } = require('express-validator');
const userRouter = express.Router();

const { userRegister, userLogout, createOrder, verifyOrder, getAllBookings, updateUser, deleteUser, addFavorite, getFavoriteTurfs, login, removeFavoriteTurf, getAllNotifications, getBookedSlots, submitReview, getPendingReviews, addSubscriptionSlot, getSubscriptionSlots } = require('../controllers/user-controller');
const {authMiddleware} = require("../middleware/authMiddleware")


userRouter.post(
  "/userRegister",
  [
    body("phone")
      .notEmpty()
      .withMessage("Phone number is required")
      .isLength({ min: 10, max: 10 })
      .withMessage("Phone number must be 10 digits")
      .isMobilePhone("en-IN")
      .withMessage("Enter a valid Indian phone number"),


    body("fullname")
      .optional()
      .isLength({ min: 3 })
      .withMessage("Full name must be at least 3 characters"),

    
  ],
  userRegister
);

userRouter.post(
  "/login",
  [
    body("phone")
      .optional()
      .isLength({ min: 10, max: 10 })
      .withMessage("Phone number must be 10 digits")
      .isMobilePhone("en-IN")
      .withMessage("Enter a valid Indian phone number"),

    body("email")
      .optional()
      .isEmail()
      .withMessage("Enter a valid email"),

    
  ],
  login
);

userRouter.post("/createOrder", authMiddleware,createOrder );
userRouter.post("/verifyPayment", authMiddleware, verifyOrder );
userRouter.get("/allBookings", authMiddleware, getAllBookings);
userRouter.post("/updateUser", authMiddleware, updateUser);
userRouter.post("/addFavorite", authMiddleware, addFavorite);
userRouter.get("/getFavoriteTurfs", authMiddleware, getFavoriteTurfs);
userRouter.post("/deleteUser", authMiddleware, deleteUser);
userRouter.post("/removeFavoriteTurf", authMiddleware, removeFavoriteTurf);
userRouter.get("/getNotfications", authMiddleware, getAllNotifications);
userRouter.get("/getBookedSlots", authMiddleware, getBookedSlots);
userRouter.post("/submitReview", authMiddleware, submitReview);
userRouter.get("/pendingReview", authMiddleware, getPendingReviews);

userRouter.get("/getSubscription", authMiddleware, getSubscriptionSlots);




userRouter.post('/userLogout', userLogout);

module.exports = userRouter;

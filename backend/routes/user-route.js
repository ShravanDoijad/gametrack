const express = require('express');
const { body } = require('express-validator');
const userRouter = express.Router();

const { userRegister, userLogout, createOrder, verifyOrder, getAllBookings, updateUser, deleteUser, addFavorite, getFavoriteTurfs, login, removeFavoriteTurf, getAllNotifications, getBookedSlots } = require('../controllers/user-controller');
const {authMiddleware} = require("../middleware/authMiddleware")


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




userRouter.post('/userLogout', userLogout);

module.exports = userRouter;

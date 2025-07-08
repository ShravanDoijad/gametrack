const express = require('express');
const { body } = require('express-validator');
const userRouter = express.Router();

const { userRegister, userLogout, createOrder, verifyOrder, getAllBookings, updateUser, deleteUser, addFavorite, getFavoriteTurfs, login } = require('../controllers/user-controller');
const {userOrOwnerMiddleware} = require("../middleware/authMiddleware")


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

userRouter.post('/userLogout', userLogout);

module.exports = userRouter;

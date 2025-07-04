const express = require('express');
const { body } = require('express-validator');
const userRouter = express.Router();

const { userRegister, userLogout, createOrder, verifyOrder, getAllBookings, updateUser, deleteUser, addFavorite } = require('../controllers/user-controller');
const {userMiddleware} = require("../middleware/authMiddleware")


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



userRouter.post("/createOrder", userMiddleware,createOrder );
userRouter.post("/verifyPayment", userMiddleware, verifyOrder );
userRouter.get("/allBookings", userMiddleware, getAllBookings);
userRouter.post("/updateUser", userMiddleware, updateUser);
userRouter.post("/addFavorite", userMiddleware, addFavorite);
userRouter.post("/deleteUser", userMiddleware, deleteUser);

userRouter.post('/userLogout', userLogout);

module.exports = userRouter;

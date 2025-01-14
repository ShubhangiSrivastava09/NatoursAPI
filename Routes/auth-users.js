import express from "express";
import UserTour from "../Models/UserTour.model.js";
import { CatchError } from "../utils/catchError.js";
import ErrorHandler from "../utils/errorHandler.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

const jwtSign = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "5m",
  });
};

router.route("/signup").post(
  CatchError(async (req, res, next) => {
    const { name, email, password } = req.body;

    const accpresent = await UserTour.findOne({ email });
    if (accpresent) {
      return next(new ErrorHandler("Email already exists", 400));
    }

    const hashPassword = await bcrypt.hash(password, 12);

    const newUser = new UserTour({ name, email, password: hashPassword });

    await newUser.save();

    const token = jwtSign(newUser._id);
    res.json({
      status: "Success",
      token,
      message: `User created successfully`,
      data: newUser,
    });
  })
);

router.route("/login").post(
  CatchError(async (req, res, next) => {
    const { email, password } = req.body;

    // Check if email and password is provided
    if (!email || !password) {
      return next(new ErrorHandler("Please provide email and password", 400));
    }
    // Find user in the database
    //.select("+password") to select the password field as it is not selected by default
    const user = await UserTour.findOne({ email }).select("+password");

    // if (!user) {
    //   return next(new ErrorHandler("Invalid credentials", 401));
    // }

    // if (!(await bcrypt.compare(password, user.password))) {
    //   return next(new ErrorHandler("Invalid credentials", 401));
    // }
    // const correct = await user.correctPassword(password, user.password);

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new ErrorHandler("Invalid credentials", 401));
    }

    const token = jwtSign(user._id);

    res.json({
      status: "Success",
      token,
      message: `User logged in successfully`,
    });
  })
);

router.route("/getAllUsers").get(
  CatchError(async (req, res, next) => {
    if (req.body.length === 0) {
      return next(new ErrorHandler("No users found", 404));
    }

    return res.json({
      status: "Success",
      data: await UserTour.find(),
    });
  })
);

export { router as AuthUsers };

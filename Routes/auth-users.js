import express from "express";
import { promisify } from "util";
import { CatchError } from "../utils/catchError.js";
import ErrorHandler from "../utils/errorHandler.js";
import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import crypto from "crypto";

import UserTour from "../Models/UserTour.model.js";
import SendEmail from "../utils/email.js";

const router = express.Router();

export const createCookie = (res, token) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);
};

export const protect = CatchError(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
    console.log(req.headers.authorization);
  }
  if (!token) {
    return next(new ErrorHandler("Please login to access", 401));
  }

  const decoded = await promisify(jsonwebtoken.verify)(
    token,
    process.env.JWT_SECRET
  );

  const currentuser = await UserTour.findById(decoded.id);

  if (!currentuser) {
    new ErrorHandler("User not found", 404);
  }

  //.iat is the time when the token was issued
  if (currentuser.changedPasswordAfter(decoded.iat)) {
    return next(
      new ErrorHandler(
        "User recently changed password! Please login again",
        401
      )
    );
  }

  req.user = currentuser;
  next();
});

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          "You do not have permission to perform this action",
          403
        )
      );
    }
    next();
  };
};

const jwtSign = (id) => {
  return jsonwebtoken.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "5m",
  });
};

router.route("/signup").post(
  CatchError(async (req, res, next) => {
    const { name, email, role, password } = req.body;

    const accpresent = await UserTour.findOne({ email });
    if (accpresent) {
      return next(new ErrorHandler("Email already exists", 400));
    }

    const hashPassword = await bcrypt.hash(password, 12);

    const newUser = new UserTour({ name, email, role, password: hashPassword });

    await newUser.save();

    const token = jwtSign(newUser._id);
    createCookie(res, token);
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
    createCookie(res, token);
    res.json({
      status: "Success",
      token,
      message: `User logged in successfully`,
    });
  })
);

router.route("/forgotPassword").post(
  CatchError(async (req, res, next) => {
    const email = req.body.email;
    const user = await UserTour.findOne({ email });

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/ /resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
      await SendEmail({
        email: user.email,
        subject: "Your password reset token (valid for 10 min)",
        message,
      });

      res.status(200).json({
        status: "Success",
        message: "Token sent to email",
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
        new ErrorHandler(
          "There was an error sending the email. Try again later!",
          500
        )
      );
    }
  })
);

router.route("/resetPassword/:token").patch(
  CatchError(async (req, res, next) => {
    const { password } = req.body;
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await UserTour.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorHandler("Token is invalid or has expired", 400));
    }

    const hashPassword = await bcrypt.hash(password, 12);
    user.password = hashPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    const token = jwtSign(user._id);

    res.status(200).json({
      status: "Success",
      token,
      message: "Password reset successfully",
    });
  })
);

router.route("/updatePassword").patch(
  protect,
  CatchError(async (req, res, next) => {
    const { currentPassword, enteredPassword } = req.body;
    const user = await UserTour.findById(req.user.id).select("+password");
    if (!(await user.correctPassword(currentPassword, user.password))) {
      return next(new ErrorHandler("Your current password is wrong", 401));
    }

    user.password = await bcrypt.hash(enteredPassword, 12);

    await user.save();

    const token = jwtSign(user._id);

    res.status(200).json({
      status: "Success",
      token,
      message: "Password updated successfully",
    });
  })
);

export { router as AuthUsers };

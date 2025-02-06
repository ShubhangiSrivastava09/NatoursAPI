import express from "express";

import { protect } from "./auth-users.js";
import UserTour from "../Models/UserTour.model.js";
import { CatchError } from "../utils/catchError.js";
import ErrorHandler from "../utils/errorHandler.js";
import { deleteOne } from "../utils/factoryFunctions.js";

const router = express.Router();

const filteredbody = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

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
router.route("/getUser").get(
  protect,
  CatchError(async (req, res) => {
    if (req.params.id === req.user._id) {
      const user = await UserTour.findById(req.user._id);
      return res.json({
        status: "Success",
        data: user,
      });
    }
  })
);
router.route("/updateUser").patch(
  protect,
  CatchError(async (req, res, next) => {
    if (req.body.password) {
      return next(new ErrorHandler("this is not the route to update password"));
    }

    const user = await UserTour.findByIdAndUpdate(
      req.user._id,
      filteredbody(req.body, "name", "email"),
      {
        new: true,
        runValidators: true,
      }
    );

    return res.json({
      status: "Success",
      data: user,
    });
  })
);

router.route("/deleteUser/:id").delete(protect, deleteOne(UserTour));

export { router as UsersRoute };

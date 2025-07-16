import express from "express";

import Review from "../Models/review.model.js";
import { CatchError } from "../utils/catchError.js";
import { protect, restrictTo } from "./auth-users.js";
import { deleteOne, updateOne } from "../utils/factoryFunctions.js";

const router = express.Router({ mergeParams: true });

router.use(protect); // Ensure the user is authenticated for all routes in this router
router.route("/").post(
  restrictTo("user"),
  CatchError(async (req, res, next) => {
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    const review = await Review.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        review,
      },
    });
  })
);

router.route("/").get(
  CatchError(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const reviews = await Review.find(filter);

    res.status(200).json({
      status: "success",
      results: reviews.length,
      data: {
        reviews,
      },
    });
  })
);
router
  .route("/update/:id")
  .patch(restrictTo("user", "admin"), updateOne(Review));
router
  .route("/delete/:id")
  .delete(restrictTo("user", "admin"), deleteOne(Review));
export { router as ReviewRouter };

import ErrorHandler from "../utils/errorHandler.js";
import { CatchError } from "../utils/catchError.js";

export const createOne = (Model) =>
  CatchError(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

export const updateOne = (Model) =>
  CatchError(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }); //new: true will return the updated document  and runValidators will run the validators on the updated data
    if (!doc) {
      return next(new ErrorHandler("No document found with that ID", 404));
    }
    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

export const deleteOne = (Model) =>
  CatchError(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new ErrorHandler("No document found with that ID", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });

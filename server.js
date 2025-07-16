import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import ExpressMongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";

import { AuthUsers } from "./Routes/auth-users.js";
import { ToursRoute } from "./Routes/tours.js";
import { UsersRoute } from "./Routes/users.js";
import { ReviewRouter } from "./Routes/reviews.js";
import ErrorHandler from "./utils/errorHandler.js";
import { ErrorHandlerMiddleware } from "./middleware/errorHandleMiddleware.js";

//define the path of the env file which is in the root directory
//path.resolve() will give the root directory of the project
//.env is the file name
//if we don't provide the path of the env file then it will take the default env file
dotenv.config({ path: path.join(path.resolve(), ".env") });

const mongoUri = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "db not connected"));
db.on("open", () => {
  console.log("Database Connected");
});

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "10kb" }));
app.use(bodyParser.urlencoded({ extended: true }));

//data sanitization against NoSQL query injection

app.use(ExpressMongoSanitize());

//data sanitization against XSS(cross site scripting) attacks

app.use(xss());

//prevent parameter pollution
//it will remove duplicate parameters from the query string
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingQuantity",
      "ratingAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ], //array of parameters which are allowed to have duplicate values
  })
);

//helmet is a middleware which sets various http headers to secure the application
//it is a collection of 14 smaller middleware functions that set security-related HTTP headers
app.use(helmet());

//morgan is a middleware which logs the request details in the console
app.use(morgan("dev"));

//rate limiting middleware to limit the number of requests from a single IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/", limiter);

//routes
app.use("/tours", ToursRoute);
app.use("/auth-users", AuthUsers);
app.use("/users", UsersRoute);
app.use("/reviews", ReviewRouter);

//to handle all the undefined routes
app.all("*", (req, res, next) => {
  next(new ErrorHandler(`Can't find ${req.originalUrl} on this server!`, 404));
});

//error handler middleware to handle all errors in the application and send appropriate response to the client or developer
app.use(ErrorHandlerMiddleware);

app.listen(PORT, () =>
  console.log(`Server running on port ${PORT} ${process.env.NODE_ENV}`)
);

import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import morgan from "morgan";
import { AuthUsers } from "./Routes/auth-users.js";
import { ToursRoute } from "./Routes/tours.js";
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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

console.log(process.env.NODE_ENV);
// app.use((req, res, next) => {
//   console.log("middleware");
//   next();
// });
app.use(morgan("dev"));
// app.use((req, res, next) => {
//   console.log("Next middleware");
//   next();
// });

app.use("/tours", ToursRoute);
app.use("/users", AuthUsers);

//to handle all the undefined routes
app.all("*", (req, res, next) => {
  next(new ErrorHandler(`Can't find ${req.originalUrl} on this server!`, 404));
});

//error handler middleware to handle all errors in the application and send appropriate response to the client or developer
app.use(ErrorHandlerMiddleware);

app.listen(PORT, () =>
  console.log(`Server running on port ${PORT} ${process.env.NODE_ENV}`)
);

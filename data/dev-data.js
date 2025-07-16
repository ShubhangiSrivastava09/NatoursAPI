import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Tour from "../Models/tours.model.js";
import User from "../Models/UserTour.model.js";
import Review from "../Models/review.model.js";
// import tourslist from "./tours.json" assert { type: "json" };

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

// READ JSON FILE
const tours = JSON.parse(fs.readFileSync("./data/tours.json", "utf-8"));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, "utf-8")
);

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log("Data successfully loaded!");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETE ALL DATA FROM DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log("Data successfully deleted!");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}

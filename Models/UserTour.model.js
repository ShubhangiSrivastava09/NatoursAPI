import mongoose from "mongoose";
import isEmail from "validator/lib/isEmail.js";
import bcrypt from "bcryptjs";

const UserTourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [isEmail, "Please provide a valid email"],
  },
  photo: String,
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false, // This will not show the password in any output of the API call (like in the getAllUsers route)
  },
});

// UserTourSchema.pre("save", async function (next) {
//   // Only run this function if password was actually modified
//   if (this.isModified("password")) return next();
//   // Hash the password with cost of 12
//   //
//   this.password = await bcrypt.hash(this.password, 12);

//   // Delete passwordConfirm field from the database
//   this.passwordConfirm = undefined;

//   next();
// });

UserTourSchema.methods.correctPassword = async function (
  candidatePassowrd,
  userPassword
) {
  return await bcrypt.compare(candidatePassowrd, userPassword);
};

const UserTour = mongoose.model("UserTour", UserTourSchema);

export default UserTour;

import mongoose from "mongoose";
import isEmail from "validator/lib/isEmail.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false, // This will not show the password in any output of the API call (like in the getAllUsers route)
  },
  passwordChangedAt: {
    type: Date,
    default: Date.now(),
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
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
UserTourSchema.pre("find", async function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});
UserTourSchema.methods.correctPassword = async function (
  candidatePassowrd,
  userPassword
) {
  return await bcrypt.compare(candidatePassowrd, userPassword);
};

UserTourSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

UserTourSchema.methods.createPasswordResetToken = function () {
  // Generate the random token
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const UserTour = mongoose.model("UserTour", UserTourSchema);

export default UserTour;

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    provider_id: {
      type: String,
      default: null,
    },
    provider: {
      type: String,
      default: "email",
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      default: "",
    },
    lastName: {
      type: String,
      default: "",
    },
    phoneNumber: {
      type: String,
    },
    role: {
      type: String,
      enum: ["Admin", "User", "Farmer"],
      default: "User",
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say"],
      default: "Prefer not to say",
    },
    dateOfBirth: {
      type: Date,
      required: true,
      set: (val) => {
        const date = new Date(val);
        date.setHours(0, 0, 0, 0);
        return date;
      },
    },
  },
  { timestamps: true, collection: "FarmerApp" }
);

const User = mongoose.model("User", userSchema);

module.exports = User;

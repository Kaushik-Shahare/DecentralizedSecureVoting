const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  blockchainScore: { type: Number, default: 0 },
});

const voteSchema = new mongoose.Schema(
  {
    eventCode: { type: String, required: true, unique: true },
    options: [optionSchema],
    votedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // New fields for geolocation and voting type
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    radius: { type: Number, required: true }, // in meters
    votingType: {
      type: String,
      enum: ["standard", "secure"],
      default: "standard",
    },
  },
  { timestamps: true, collection: "DApp" }
);

module.exports = mongoose.model("Vote", voteSchema);

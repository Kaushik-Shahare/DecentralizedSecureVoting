const mongoose = require("mongoose");

// Generate a unique event id on creation
const generateEventId = () => require("crypto").randomBytes(8).toString("hex");

const optionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: { type: String },
  voteCount: { type: Number, default: 0 },
});

const eventSchema = new mongoose.Schema(
  {
    eventId: { type: String, unique: true, default: generateEventId },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String },
    options: [optionSchema],
    voters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);
module.exports = Event;

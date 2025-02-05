const Event = require("../models/Event");

// Create a new event
const createEvent = async (req, res) => {
  // Check that req.user exists
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Unauthorized: No user found" });
  }
  const { title, description, imageUrl, options } = req.body;
  if (!title || !options || !Array.isArray(options) || options.length === 0) {
    return res
      .status(400)
      .json({ message: "Title and non-empty options array required" });
  }
  try {
    // options: array of objects with at least a name; imageUrl optional per option
    const event = new Event({
      createdBy: req.user.id,
      title,
      description,
      imageUrl,
      options, // assume options is [{ name: "...", imageUrl: "..." }, ...]
    });
    await event.save();
    res.status(201).json({ eventId: event.eventId });
  } catch (error) {
    console.error("Create event error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Vote on an option by joining the event
const voteEvent = async (req, res) => {
  const { eventId } = req.params;
  const { optionName } = req.body;
  if (!optionName) {
    return res.status(400).json({ message: "Option name is required" });
  }
  try {
    const event = await Event.findOne({ eventId });
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    // Check if the user has already voted in this event
    if (event.voters.includes(req.user.id)) {
      return res.status(400).json({ message: "User has already voted" });
    }
    // Find the specific option by name
    const option = event.options.find((opt) => opt.name === optionName);
    if (!option) {
      return res.status(400).json({ message: "Invalid option" });
    }
    option.voteCount += 1;
    // Mark user has voted in the event
    event.voters.push(req.user.id);
    await event.save();
    res.status(200).json({ message: "Vote recorded" });
  } catch (error) {
    console.error("Vote event error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get event statistics (accessible only by the event creator)
const getEventStats = async (req, res) => {
  const { eventId } = req.params;
  try {
    let event = await Event.findOne({ eventId }).populate(
      "voters",
      "firstName lastName"
    );
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    // Convert event to plain object and map voters to include a fullname field
    const eventObj = event.toObject();
    if (Array.isArray(eventObj.voters)) {
      eventObj.voters = eventObj.voters.map((user) => ({
        _id: user._id,
        fullName: `${user.firstName} ${user.lastName}`,
      }));
    }
    res.status(200).json({ event: eventObj });
  } catch (error) {
    console.error("Get event stats error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get event details for voters
const getEventDetails = async (req, res) => {
  const { eventId } = req.params;
  try {
    const event = await Event.findOne({ eventId });
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    // Convert Mongoose document to plain object
    const eventObj = event.toObject();
    // Remove voters field from event
    delete eventObj.voters;
    // Remove voteCount from each option
    if (Array.isArray(eventObj.options)) {
      eventObj.options = eventObj.options.map((option) => {
        delete option.voteCount;
        return option;
      });
    }
    res.status(200).json({ event: eventObj });
  } catch (error) {
    console.error("Get event details error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { createEvent, voteEvent, getEventStats, getEventDetails };

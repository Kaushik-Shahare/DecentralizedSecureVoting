require("dotenv").config();
const { JsonRpcProvider, Wallet, Contract } = require("ethers"); // Updated import for ethers v6
const VotingABI = require("../abis/Voting.json");
const Vote = require("../models/Vote");
const generateUniqueCode = require("../utils/generateCode");

// Helper: Calculate distance (in meters) using Haversine formula.
function getDistance(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Setup provider and signer using ENV variables
const provider = new JsonRpcProvider(process.env.ETH_RPC_URL);
const wallet = new Wallet(process.env.METAMASK_PRIVATE_KEY, provider);
const contractAddress = process.env.VOTING_CONTRACT_ADDRESS;
const votingContract = new Contract(contractAddress, VotingABI, wallet);

exports.createEvent = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  let { eventCode, optionNames, optionImages, location, radius, votingType } =
    req.body;
  // Generate a unique code if eventCode is not provided
  if (!eventCode) {
    eventCode = generateUniqueCode();
  }
  // Validate required fields for new event
  if (
    !location ||
    typeof location.lat !== "number" ||
    typeof location.lng !== "number"
  ) {
    return res
      .status(400)
      .json({ error: "Location (lat and lng) is required" });
  }
  if (!radius || typeof radius !== "number") {
    return res.status(400).json({ error: "Radius (in meters) is required" });
  }
  if (!votingType || !["standard", "secure"].includes(votingType)) {
    votingType = "standard";
  }
  try {
    console.log("Creating event with code:", eventCode);
    const tx = await votingContract.createEvent(
      eventCode,
      optionNames,
      optionImages
    );
    await tx.wait();
    console.log("Event created on blockchain");

    // Save event details in DB with location, radius and type
    const newEvent = new Vote({
      eventCode,
      options: optionNames.map((name, idx) => ({
        name,
        image: optionImages[idx],
        blockchainScore: 0,
      })),
      votedUsers: [],
      location,
      radius,
      votingType,
    });
    await newEvent.save();

    res.json({ message: "Event created", txHash: tx.hash, eventCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.vote = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { eventCode, optionIndex, voterLocation, secureConnected } = req.body;
  try {
    // Ensure event exists in DB and that the user hasn't voted yet
    const event = await Vote.findOne({ eventCode });
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (event.votedUsers.includes(req.user._id))
      return res.status(400).json({ error: "User has already voted" });

    // If event type is standard, check if voter's location is within radius.
    if (event.votingType === "standard") {
      if (
        !voterLocation ||
        typeof voterLocation.lat !== "number" ||
        typeof voterLocation.lng !== "number"
      ) {
        return res
          .status(400)
          .json({ error: "Voter location is required for standard voting" });
      }
      const distance = getDistance(
        event.location.lat,
        event.location.lng,
        voterLocation.lat,
        voterLocation.lng
      );
      if (distance > event.radius) {
        return res
          .status(403)
          .json({ error: "Voter is outside the allowed radius" });
      }
    }
    // If event type is secure, require secureConnected flag to be true.
    if (event.votingType === "secure" && !secureConnected) {
      return res
        .status(403)
        .json({ error: "Secure voting requires a secure (wired) connection" });
    }

    const tx = await votingContract.vote(eventCode, optionIndex);
    await tx.wait();

    // Update DB: record that the user has voted and update option score
    event.votedUsers.push(req.user._id);
    event.options[optionIndex].blockchainScore += 1;
    await event.save();

    res.json({ message: "Vote recorded", txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEventScores = async (req, res) => {
  const { eventCode } = req.params;
  try {
    const scores = await votingContract.getEventScores(eventCode);
    res.json({
      names: scores[0],
      scores: scores[1].map((s) => s.toNumber()),
      images: scores[2],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

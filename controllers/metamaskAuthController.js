require("dotenv").config();
const { ethers } = require("ethers"); // For ethers v6, use ethers.verifyMessage
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateNonce = () => Math.floor(Math.random() * 1000000).toString();

// Updated getNonce using updated User model fields.
exports.getNonce = async (req, res) => {
  const { walletAddress } = req.body;
  if (!walletAddress)
    return res.status(400).json({ error: "Wallet address required" });

  let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
  if (!user) {
    // Create a new user: set provider to "metamask" and generate a nonce.
    user = new User({
      email: "",
      password: "",
      firstName: "",
      walletAddress: walletAddress.toLowerCase(),
      nonce: generateNonce(),
      provider: "metamask",
    });
  } else {
    // Update user with a new nonce.
    user.nonce = generateNonce();
  }
  await user.save();
  res.json({ nonce: user.nonce });
};

// Updated verifySignature to update provider and return user info as per the updated model.
exports.verifySignature = async (req, res) => {
  const { walletAddress, signature } = req.body;
  if (!walletAddress || !signature)
    return res.status(400).json({ error: "Missing parameters" });

  const user = await User.findOne({
    walletAddress: walletAddress.toLowerCase(),
  });
  if (!user) return res.status(404).json({ error: "User not found" });

  const message = `Sign this message to authenticate: ${user.nonce}`;
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase())
      return res.status(401).json({ error: "Signature verification failed" });

    // Ensure provider is set to "metamask"
    if (user.provider !== "metamask") {
      user.provider = "metamask";
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, walletAddress: user.walletAddress },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );
    res.json({
      token,
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        provider: user.provider,
        nonce: user.nonce,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const express = require("express");
const {
  createEvent,
  getEventDetails,
  voteEvent,
  getEventStats,
} = require("../controllers/eventController");
const router = express.Router();
const auth = require("../middlewares/auth.js");

router.post("/create", auth, createEvent);
router.get("/:eventId", auth, getEventDetails);
router.post("/:eventId/vote", auth, voteEvent);
router.get("/:eventId/stats", auth, getEventStats);

module.exports = router;

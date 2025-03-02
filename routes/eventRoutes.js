const express = require("express");
const {
  getEvents,
  createEvent,
  getEventDetails,
  voteEvent,
  getEventStats,
  editEvent,
  deleteEvent,
} = require("../controllers/eventController");
const router = express.Router();
const auth = require("../middlewares/auth.js");

router.get("/", auth, getEvents);
router.post("/create", auth, createEvent);
router.get("/:eventId", auth, getEventDetails);
router.post("/:eventId/vote", auth, voteEvent);
router.get("/:eventId/stats", auth, getEventStats);
router.put("/:eventId/edit", auth, editEvent);
router.delete("/:eventId/delete", auth, deleteEvent);

module.exports = router;

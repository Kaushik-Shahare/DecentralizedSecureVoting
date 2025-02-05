const express = require("express");
const router = express.Router();
const votingController = require("../controllers/votingController");
const auth = require("../middlewares/auth");

router.post("/createEvent", auth, votingController.createEvent);
router.post("/vote", auth, votingController.vote);
router.get("/:eventCode", auth, votingController.getEventScores);

module.exports = router;

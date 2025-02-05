const express = require("express");
const router = express.Router();
const metamaskAuthController = require("../controllers/metamaskAuthController");

router.post("/getNonce", metamaskAuthController.getNonce);
router.post("/verify", metamaskAuthController.verifySignature);

module.exports = router;

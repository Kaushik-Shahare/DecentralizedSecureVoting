const express = require("express");
const authRouter = express.Router();
const {
  signup,
  signin,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const passport = require("passport");
const dotenv = require("dotenv");
dotenv.config();

authRouter.post("/signup", signup);
authRouter.post("/signin", signin);

authRouter.get(
  "/google",
  passport.authenticate("google", {
    session: false,
    scope: ["profile", "email"],
  })
);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const { token, user } = req.user;
    // Successful authentication, redirect home with token
    // const redirectUrl = `http://localhost:3001/signin?token=${token}&username=${user.username}&userId=${user._id}`;
    const redirectUrl = `${process.env.BASE_URL}?token=${token}&userId=${user._id}`;
    res.redirect(redirectUrl);
  }
);

// Password reset
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password/:token", resetPassword);

module.exports = authRouter;

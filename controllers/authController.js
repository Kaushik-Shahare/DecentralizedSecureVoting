const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;
const User = require("../models/User");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const nodemailer = require("nodemailer");

const saltRounds = 10;

const signup = async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    address,
    phoneNumber,
    gender,
    dateOfBirth,
  } = req.body;

  if (
    !email ||
    !password ||
    !firstName ||
    !lastName ||
    !address ||
    !phoneNumber ||
    !gender ||
    !dateOfBirth
  ) {
    return res.status(400).json({
      message:
        "All fields are required. email, password, firstName, lastName, address, phoneNumber, gender, dateOfBirth",
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      address,
      phoneNumber,
      gender,
      dateOfBirth,
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, SECRET_KEY);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ token });
  } catch (error) {
    console.log("Signup error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const signin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "No user found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id }, SECRET_KEY, {
      // expiresIn: "1h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ token });
  } catch (error) {
    console.log("Signin error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    await User.findByIdAndUpdate(decoded.id, {
      password: hashedPassword,
    }).exec();
    res.status(200).json({ message: "Password successfully reset" });
  } catch (error) {
    console.error("Reset password error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "No user found" });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: "1h" });
    const resetPasswordLink = `${process.env.BASE_URL}/api/auth/reset-password/${token}`;

    // Send mail with reset password link
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      secure: true,
      port: 465,
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Reset Password",
      text: `Click the following link to reset your password: ${resetPasswordLink}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Reset password link sent to your email" });
  } catch (error) {
    console.error("Forgot password error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Google OAuth 2.0

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/api/auth/google/callback`,
      scope: ["profile", "email"],
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        console.log("Google profile: ", profile);

        // Find or create user in the database
        let user = await User.findOne({
          email: profile.emails[0].value,
        });

        if (user) {
          if (user.provider === "email") {
            user.provider = "google";
            user.provider_id = profile.id;
            await user.save();
          }
        } else {
          const hashedPassword = await bcrypt.hash(
            process.env.DEFAULT_PASSWORD,
            saltRounds
          );

          let dateOfBirth = null;
          if (profile.birthday) {
            dateOfBirth = new Date(profile.birthday);
            if (isNaN(dateOfBirth.getTime())) {
              dateOfBirth = null;
            }
          }

          const firstName = profile.name.givenName || "";
          const lastName = profile.name.familyName || "";

          user = new User({
            provider: "google",
            provider_id: profile.id,
            email: profile.emails[0].value,
            firstName: firstName,
            lastName: lastName,
            gender: profile.gender,
            password: hashedPassword,
            dateOfBirth: dateOfBirth,
          });

          await user.save();
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, SECRET_KEY, {
          // expiresIn: "1h",
        });

        // Pass the token to the callback
        return cb(null, { token, user });
      } catch (error) {
        return cb(error, null);
      }
    }
  )
);

module.exports = { signup, signin, resetPassword, forgotPassword };

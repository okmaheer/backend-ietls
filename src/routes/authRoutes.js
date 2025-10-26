import express from "express";
import passport from "../config/passport.js";
import {
  googleAuthCallback,
  googleAuthFailure,
} from "../controllers/authController.js";

const router = express.Router();

// Google OAuth login route
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Google OAuth callback route
router.get(
  "/google/callback",
  passport.authenticate("google", { 
    failureRedirect: `${process.env.FRONTEND_URL}/signin?error=authentication_failed`,
    session: false 
  }),
  googleAuthCallback
);

// Failure route
router.get("/failure", googleAuthFailure);

export default router;
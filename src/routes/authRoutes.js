import express from "express";
import passport from "../config/passport.js";
import {
  googleAuthCallback,
  facebookAuthCallback,
  oauthFailure,
  adminLogin,
} from "../controllers/authController.js";

const router = express.Router();

/**
 * POST /api/auth/admin/login
 * Admin login with email and password
 * Body: { email, password }
 */
router.post("/admin/login", adminLogin);

/**
 * GET /api/auth/google
 * Initiates Google OAuth flow
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

/**
 * GET /api/auth/google/callback
 * Google OAuth callback route
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/signin?error=authentication_failed`,
    session: false
  }),
  googleAuthCallback
);

/**
 * GET /api/auth/facebook
 * Initiates Facebook OAuth flow
 */
router.get(
  "/facebook",
  passport.authenticate("facebook", {
    scope: ["email"],
  })
);

/**
 * GET /api/auth/facebook/callback
 * Facebook OAuth callback route
 */
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: `${process.env.FRONTEND_URL}/signin?error=authentication_failed`,
    session: false
  }),
  facebookAuthCallback
);

/**
 * GET /api/auth/failure
 * Generic OAuth failure handler
 */
router.get("/failure", oauthFailure);

export default router;
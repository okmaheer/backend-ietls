// controllers/authController.js
import { prisma } from "../config/prismaClient.js";
import { success, error } from "../utils/response.js";
import jwt from "jsonwebtoken";

// 🔐 Google OAuth Callback Handler
export const googleAuthCallback = async (req, res) => {
  try {
    // Validate required user data from passport
    if (!req.user || !req.user.email || !req.user.googleId) {
      // Log validation failure (won't show to user since it's a redirect)
      const validationError = new Error('Invalid user data from Google OAuth');
      validationError.details = {
        hasUser: !!req.user,
        hasEmail: !!req.user?.email,
        hasGoogleId: !!req.user?.googleId,
      };
      error(res, validationError, 400); // This logs to file
      
      return res.redirect(
        `${process.env.FRONTEND_URL}/signin?error=invalid_user_data`
      );
    }

    const { email, name, googleId, picture } = req.user;

    // Check if user exists with this Google ID
    let user = await prisma.users.findFirst({
      where: { google_id: googleId },
    });

    if (!user) {
      // Check if user exists with this email but different auth provider
      const existingEmailUser = await prisma.users.findFirst({
        where: { 
          email,
          OR: [
            { auth_provider: { not: 'google' } },
            { auth_provider: null }
          ]
        },
      });

      if (existingEmailUser) {
        // Link the Google account to existing user
        user = await prisma.users.update({
          where: { id: existingEmailUser.id },
          data: {
            google_id: googleId,
            auth_provider: 'google',
            profile_picture: picture,
            email_verified_at: new Date(),
            updated_at: new Date(),
          },
        });
      } else {
        // Create new Google user
        user = await prisma.users.create({
          data: {
            name: name || email.split('@')[0],
            email,
            google_id: googleId,
            auth_provider: 'google',
            profile_picture: picture,
            password: null,
            status: "1",
            email_verified_at: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }
    } else {
      // Update existing Google user
      user = await prisma.users.update({
        where: { id: user.id },
        data: { 
          profile_picture: picture,
          updated_at: new Date() 
        },
      });
    }

    // Validate JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id.toString(), 
        email: user.email, 
        name: user.name,
        authProvider: user.auth_provider 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Build redirect URL safely
    const redirectUrl = new URL('/auth/callback', process.env.FRONTEND_URL);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('user', JSON.stringify({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      authProvider: user.auth_provider,
      profilePicture: user.profile_picture,
    }));

    res.redirect(redirectUrl.toString());
    
  } catch (err) {
    // ✅ Automatically logs to file with full error details
    error(res, err, 500); // Logs error with stack trace
    
    // Redirect with specific error messages
    const errorMessage = err.code === 'P2002' 
      ? 'duplicate_account' 
      : 'authentication_failed';
    
    res.redirect(
      `${process.env.FRONTEND_URL}/signin?error=${errorMessage}`
    );
  }
};

// ❌ Google Auth Failure Handler
export const googleAuthFailure = (req, res) => {
  // Log the failure
  const failureError = new Error('Google OAuth authentication failed');
  error(res, failureError, 401); // ✅ Automatically logs to file
  
  res.redirect(
    `${process.env.FRONTEND_URL}/signin?error=authentication_failed`
  );
};
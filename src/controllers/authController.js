import { prisma } from "../config/prismaClient.js";
import { success, error } from "../utils/response.js";
import jwt from "jsonwebtoken";

// 🔐 Google OAuth Callback Handler
export const googleAuthCallback = async (req, res) => {
  try {
    // Validate required user data from passport
    if (!req.user || !req.user.email || !req.user.googleId) {
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
            name: name || email.split('@')[0], // Fallback if name is missing
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

    // Redirect to frontend with token
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        authProvider: user.auth_provider,
        profilePicture: user.profile_picture,
      }))}`
    );
  } catch (err) {
    console.error("❌ Google Auth Error:", err);
    
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
  res.redirect(
    `${process.env.FRONTEND_URL}/signin?error=authentication_failed`
  );
};
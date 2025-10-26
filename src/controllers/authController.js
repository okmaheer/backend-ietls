// controllers/authController.js
import { prisma } from "../config/prismaClient.js";
import { success, error } from "../utils/response.js";
import jwt from "jsonwebtoken";

export const googleAuthCallback = async (req, res) => {
  try {
    // Validate required user data from passport
    if (!req.user || !req.user.email || !req.user.googleId) {
      const validationError = new Error('Invalid user data from Google OAuth');
      error(res, validationError, 400);
      
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
      // Check if user exists with this email
      const existingEmailUser = await prisma.users.findFirst({
        where: { 
          email,
          google_id: null // Only find users without Google ID
        },
      });

      if (existingEmailUser) {
        // Link the Google account to existing user
        user = await prisma.users.update({
          where: { id: existingEmailUser.id },
          data: {
            google_id: googleId,
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
      // Update existing Google user's profile picture
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
        name: user.name
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
      profilePicture: user.profile_picture,
      isGoogleUser: !!user.google_id // Frontend can use this if needed
    }));

    res.redirect(redirectUrl.toString());
    
  } catch (err) {
    console.error("=== Google Auth Error ===");
    console.error("Error:", err);
    
    // This will automatically log to file
    error(res, err, 500);
    
    // Determine specific error message
    let errorMessage = 'authentication_failed';
    
    if (err.code === 'P2002') {
      errorMessage = 'duplicate_account';
    } else if (err.message?.includes('JWT_SECRET')) {
      errorMessage = 'server_configuration_error';
    }
    
    res.redirect(
      `${process.env.FRONTEND_URL}/signin?error=${errorMessage}`
    );
  }
};

export const googleAuthFailure = (req, res) => {
  const failureError = new Error('Google OAuth authentication failed');
  error(res, failureError, 401);
  
  res.redirect(
    `${process.env.FRONTEND_URL}/signin?error=authentication_failed`
  );
};
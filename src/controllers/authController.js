
// controllers/authController.js
import { prisma } from "../config/prismaClient.js";
import { success, error } from "../utils/response.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { ROLES, USER_MODEL_TYPE, getUserRoles } from "../utils/roleHelper.js";

// 🔐 Admin Login with Email & Password
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔍 Login attempt for email:", email);

    // Validate input
    if (!email || !password) {
      console.log("❌ Missing email or password");
      return error(res, new Error("Email and password are required"), 400);
    }

    // Find user by email
    const user = await prisma.users.findFirst({
      where: { email },
    });

    console.log("👤 User found:", user ? "YES" : "NO");
    
    if (!user) {
      console.log("❌ User not found in database");
      return error(res, new Error("Invalid email or password"), 401);
    }

    console.log("📋 User details:", {
      id: user.id.toString(),
      email: user.email,
      status: user.status,
      auth_provider: user.auth_provider,
      has_password: !!user.password,
      password_format: user.password?.substring(0, 4), // Show hash format
    });

    // Check if user is active
    if (user.status !== "1") {
      console.log("❌ User account is inactive, status:", user.status);
      return error(res, new Error("Account is inactive"), 403);
    }

    // Verify password exists
    if (!user.password) {
      console.log("❌ User has no password (OAuth user)");
      return error(res, new Error("This account uses OAuth login. Please use Google sign-in"), 401);
    }
    
    let passwordHash = user.password;
    if (passwordHash.startsWith('$2y$')) {
      console.log("🔄 Converting Laravel $2y$ hash to $2a$ for compatibility");
      passwordHash = passwordHash.replace(/^\$2y\$/, '$2a$');
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, passwordHash);

    if (!isPasswordValid) {
      return error(res, new Error("Invalid email or password"), 401);
    }

    const roles = await getUserRoles(user.id);

    // ✅ Check if user is admin
    if (!roles.includes(ROLES.ADMIN)) {
      return error(res, new Error("Access denied. Admin privileges required"), 403);
    }

    // Validate JWT_SECRET
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const isAdmin = roles.includes(ROLES.ADMIN);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        authProvider: user.auth_provider,
        roles,
        isAdmin,
        duration: user.duration,
        status: user.status
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return success response
    return success(
      res,
      {
        token,
        user: {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          authProvider: user.auth_provider,
          profilePicture: user.profile_picture,
          roles,
          isAdmin,
        },
      },
      "Login successful"
    );
  } catch (err) {
    console.error("❌ Login error:", err);
    return error(res, err, 500);
  }
};

// 🔐 Google OAuth Callback Handler
export const googleAuthCallback = async (req, res) => {
  try {
    // Validate required user data from passport
    if (!req.user || !req.user.email || !req.user.googleId) {
      const validationError = new Error('Invalid user data from Google OAuth');
      validationError.details = {
        hasUser: !!req.user,
        hasEmail: !!req.user?.email,
        hasGoogleId: !!req.user?.googleId,
      };
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
        // ✅ Create new Google user with 'user' role assignment
        user = await prisma.$transaction(async (tx) => {
          // Create user
          const newUser = await tx.users.create({
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

          // ✅ Find 'user' role
          const userRole = await tx.roles.findFirst({
            where: { name: ROLES.USER }
          });

          if (!userRole) {
            throw new Error('User role not found in database. Please ensure roles are seeded.');
          }

          // ✅ Assign 'user' role to new user
          await tx.model_has_roles.create({
            data: {
              role_id: userRole.id,
              model_type: USER_MODEL_TYPE,
              model_id: newUser.id,
            },
          });

          return newUser;
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

    // ✅ Fetch user roles separately
    const roles = await getUserRoles(user.id);

    // Validate JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    const isAdmin = roles.includes(ROLES.ADMIN);

    // ✅ Generate JWT token with roles
    const token = jwt.sign(
      { 
        id: user.id.toString(), 
        email: user.email, 
        name: user.name,
        authProvider: user.auth_provider,
        roles,
        isAdmin,
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
      roles,
      isAdmin,
    }));

    res.redirect(redirectUrl.toString());
    
  } catch (err) {
    // ✅ Automatically logs to file with full error details
    error(res, err, 500);
    
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
  const failureError = new Error('Google OAuth authentication failed');
  error(res, failureError, 401);
  
  res.redirect(
    `${process.env.FRONTEND_URL}/signin?error=authentication_failed`
  );
};
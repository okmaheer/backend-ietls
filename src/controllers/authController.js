
// controllers/authController.js
import { prisma } from "../config/prismaClient.js";
import { success, error } from "../utils/response.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { ROLES, USER_MODEL_TYPE, getUserRoles } from "../utils/roleHelper.js";
import { logError, logInfo, logDebug } from "../utils/logger.js";
import { sendEmail } from "../services/emailService.js";

/**
 * Verify a plaintext password against a stored hash, transparently handling
 * Laravel's `$2y$` bcrypt prefix (CBT/Laravel-created hashes) alongside the
 * `$2a$`/`$2b$` hashes bcrypt itself produces.
 */
async function verifyPassword(plaintext, storedHash) {
  if (!storedHash) return false;
  const normalized = storedHash.startsWith("$2y$")
    ? storedHash.replace(/^\$2y\$/, "$2a$")
    : storedHash;
  return bcrypt.compare(plaintext, normalized);
}

/**
 * Send a welcome / login-notification email — fire-and-forget.
 * Failures are logged but never block the login response.
 */
function sendWelcomeEmail(user) {
  const firstName = (user.name || "there").split(" ")[0];
  const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;

  sendEmail({
    to: user.email,
    subject: "Welcome back to IELTS Prep & Practice!",
    title: "Welcome Back!",
    previewText: `Hi ${firstName}, you've just signed in to your IELTS Prep & Practice account.`,
    body: `
      <p style="margin:0 0 16px 0;">Hi <strong>${firstName}</strong>,</p>
      <p style="margin:0 0 16px 0;">
        You've successfully signed in to your <strong>IELTS Prep &amp; Practice</strong> account.
        Head to your dashboard to continue your preparation journey.
      </p>
      <p style="margin:0;">Good luck with your studies!</p>
    `,
    button: { text: "Go to Dashboard", url: dashboardUrl },
    footerNote: "If you did not sign in, please contact us immediately.",
  }).catch((err) => logError("Welcome email failed", err, { email: user.email }));
}

// 🔄 Generic OAuth Callback Handler (DRY principle)
const handleOAuthCallback = async (req, res, provider) => {
  try {
    console.log(`\n🔥 ${provider} OAuth Callback - START`);
    console.log(`🔥 ${provider} OAuth - User data from passport:`, {
      hasUser: !!req.user,
      email: req.user?.email,
      name: req.user?.name,
      providerId: req.user?.[`${provider.toLowerCase()}Id`]
    });
    logDebug(`${provider} OAuth callback initiated`, { hasUser: !!req.user });

    // Validate required user data from passport
    const providerIdField = `${provider.toLowerCase()}Id`;
    if (!req.user || !req.user.email || !req.user[providerIdField]) {
      const validationError = new Error(`Invalid user data from ${provider} OAuth`);
      validationError.details = {
        hasUser: !!req.user,
        hasEmail: !!req.user?.email,
        hasProviderId: !!req.user?.[providerIdField],
      };
      logError(`${provider} OAuth validation failed`, validationError, validationError.details);
      error(res, validationError, 400);

      return res.redirect(
        `${process.env.FRONTEND_URL}/signin?error=invalid_user_data`
      );
    }

    const { email, name, picture } = req.user;
    const providerId = req.user[providerIdField];
    const dbProviderField = `${provider.toLowerCase()}_id`;

    logDebug(`${provider} OAuth user data received`, { email, name, providerId });

    // Check if user exists with this provider ID
    let user = await prisma.users.findFirst({
      where: { [dbProviderField]: providerId },
    });

    if (!user) {
      // Check if user exists with this email but not yet linked to this provider.
      // Require google_id to be null so we only match unlinked accounts.
      const existingEmailUser = await prisma.users.findFirst({
        where: {
          email,
          [dbProviderField]: null,
          auth_provider: { not: provider.toLowerCase() },
        },
      });

      if (existingEmailUser) {
        logInfo(`Linking ${provider} account to existing user`, { userId: existingEmailUser.id.toString(), email });
        // Link the provider account to existing user
        user = await prisma.users.update({
          where: { id: existingEmailUser.id },
          data: {
            [dbProviderField]: providerId,
            auth_provider: provider.toLowerCase(),
            profile_picture: picture,
            email_verified_at: new Date(),
            updated_at: new Date(),
          },
        });
      } else {
        logInfo(`Creating new ${provider} user`, { email });
        // ✅ Create new user with 'user' role assignment
        user = await prisma.$transaction(async (tx) => {
          // Create user
          const newUser = await tx.users.create({
            data: {
              name: name || email.split('@')[0],
              email,
              [dbProviderField]: providerId,
              auth_provider: provider.toLowerCase(),
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
        logInfo(`New ${provider} user created successfully`, { userId: user.id.toString(), email });
      }
    } else {
      logDebug(`Updating existing ${provider} user profile`, { userId: user.id.toString() });

      // Sync is_user_paid: if this Google-linked record is unpaid but admin
      // created a paid account with the same email, propagate the paid status.
      // This happens when a user tries Google login before the admin grants access.
      let syncedPaid = user.is_user_paid;
      if (!user.is_user_paid && user.email) {
        const paidAccount = await prisma.users.findFirst({
          where: { email: user.email, is_user_paid: true, id: { not: user.id } },
        });
        if (paidAccount) {
          syncedPaid = true;
          logInfo('Syncing is_user_paid from admin-created account', { userId: user.id.toString(), email: user.email });
        }
      }

      user = await prisma.users.update({
        where: { id: user.id },
        data: {
          profile_picture: picture,
          is_user_paid: syncedPaid,
          updated_at: new Date()
        },
      });
    }

    let roles = await getUserRoles(user.id);

    if (roles.length === 0) {
      logDebug('Assigning default user role', { userId: user.id.toString() });
      const userRole = await prisma.roles.findFirst({
        where: { name: ROLES.USER }
      });

      if (!userRole) {
        throw new Error('User role not found in database. Please ensure roles are seeded.');
      }

      await prisma.model_has_roles.create({
        data: {
          role_id: userRole.id,
          model_type: USER_MODEL_TYPE,
          model_id: user.id,
        },
      });

      // Refetch roles
      roles = await getUserRoles(user.id);
    }

    // Validate JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    const isAdmin = roles.includes(ROLES.ADMIN);

    const token = jwt.sign(
      {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        authProvider: user.auth_provider,
        loginMethod: provider.toLowerCase(),
        roles,
        isAdmin,
        isUserPaid: user.is_user_paid,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    logInfo(`${provider} OAuth login successful`, {
      userId: user.id.toString(),
      email: user.email,
      roles
    });

    sendWelcomeEmail(user);

    // Build redirect URL safely
    const redirectUrl = new URL('/auth/callback', process.env.FRONTEND_URL);
    redirectUrl.searchParams.set('token', token);
    const userData = {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      authProvider: user.auth_provider,
      loginMethod: provider.toLowerCase(),
      profilePicture: user.profile_picture,
      roles,
      isAdmin,
      isUserPaid: user.is_user_paid,
    };
    redirectUrl.searchParams.set('user', JSON.stringify(userData));

    console.log(`\n✅ ${provider} OAuth - Token generated:`, {
      tokenLength: token.length,
      tokenPreview: token.substring(0, 30) + '...',
      userId: user.id.toString(),
      email: user.email,
      roles,
      isAdmin
    });
    console.log(`✅ ${provider} OAuth - Redirect URL:`, redirectUrl.toString().substring(0, 200) + '...');
    console.log(`✅ ${provider} OAuth - Full redirect URL length:`, redirectUrl.toString().length);
    console.log(`🔥 ${provider} OAuth Callback - END - Redirecting now...\n`);

    res.redirect(redirectUrl.toString());

  } catch (err) {
    logError(`${provider} OAuth authentication failed`, err, {
      email: req.user?.email,
      method: req.method,
      url: req.originalUrl
    });
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

// 🔐 Admin Login with Email & Password
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    logDebug('Admin login attempt', { email });

    // Validate input
    if (!email || !password) {
      logDebug('Admin login failed - missing credentials');
      return error(res, new Error("Email and password are required"), 400);
    }

    // Find user by email
    const user = await prisma.users.findFirst({
      where: { email },
    });

    logDebug('User lookup result', { email, found: !!user });

    if (!user) {
      logDebug('Admin login failed - user not found');
      return error(res, new Error("Invalid email or password"), 401);
    }

    logDebug('User login details', {
      id: user.id.toString(),
      email: user.email,
      status: user.status,
      auth_provider: user.auth_provider,
      has_password: !!user.password,
    });

    // Check if user is active
    if (user.status !== "1") {
      logDebug('Admin login failed - account inactive', { status: user.status });
      return error(res, new Error("Account is inactive"), 403);
    }

    // Verify password exists
    if (!user.password) {
      logDebug('Admin login failed - OAuth user attempted password login');
      return error(res, new Error("This account uses OAuth login. Please use Google sign-in"), 401);
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      logDebug('Admin login failed - invalid password', { email });
      return error(res, new Error("Invalid email or password"), 401);
    }

    const roles = await getUserRoles(user.id);

    // ✅ Check if user is admin
    if (!roles.includes(ROLES.ADMIN)) {
      logDebug('Login failed - user lacks admin privileges', { email, roles });
      return error(res, new Error("Access denied. Admin privileges required"), 403);
    }

    // Validate JWT_SECRET
    if (!process.env.JWT_SECRET) {
      const jwtError = new Error("JWT_SECRET is not configured");
      logError('JWT_SECRET not configured', jwtError);
      return error(res, jwtError, 500);
    }

    const isAdmin = roles.includes(ROLES.ADMIN);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        authProvider: user.auth_provider,
        loginMethod: 'email',
        roles,
        isAdmin,
        isUserPaid: user.is_user_paid,
        duration: user.duration,
        status: user.status
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    logInfo('Admin login successful', {
      userId: user.id.toString(),
      email: user.email,
      roles
    });

    sendWelcomeEmail(user);

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
          isUserPaid: user.is_user_paid,
        },
      },
      "Login successful"
    );
  } catch (err) {
    logError("Admin login failed", err, {
      email: req.body.email,
      method: req.method,
      url: req.originalUrl
    });
    return error(res, err, 500);
  }
};

// 🔐 Email & Password Login (any user with a password set — this is the
// login required to access premium tests; free users normally sign in
// with Google instead, see googleAuthCallback/facebookAuthCallback).
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    logDebug('Email login attempt', { email });

    if (!email || !password) {
      return error(res, new Error("Email and password are required"), 400);
    }

    const user = await prisma.users.findFirst({ where: { email } });

    if (!user) {
      return error(res, new Error("Invalid email or password"), 401);
    }

    if (user.status !== "1") {
      return error(res, new Error("Account is inactive"), 403);
    }

    if (!user.password) {
      return error(res, new Error("This account has no password set yet. Sign in with Google, then set a password from your account settings."), 401);
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return error(res, new Error("Invalid email or password"), 401);
    }

    const roles = await getUserRoles(user.id);
    const isAdmin = roles.includes(ROLES.ADMIN);

    const token = jwt.sign(
      {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        authProvider: user.auth_provider,
        loginMethod: 'email',
        roles,
        isAdmin,
        isUserPaid: user.is_user_paid,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    logInfo('Email login successful', { userId: user.id.toString(), email: user.email });

    sendWelcomeEmail(user);

    return success(
      res,
      {
        token,
        user: {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          authProvider: user.auth_provider,
          loginMethod: 'email',
          profilePicture: user.profile_picture,
          roles,
          isAdmin,
          isUserPaid: user.is_user_paid,
        },
      },
      "Login successful"
    );
  } catch (err) {
    logError("Email login failed", err, { email: req.body?.email });
    return error(res, err, 500);
  }
};

// 🔑 Let the current (Google/Facebook-authenticated) user set a password so
// they can also log in with email + password — required for premium test
// access. Setting a password does NOT grant premium by itself; it just
// enables the login method premium access is gated on.
export const setPassword = async (req, res) => {
  const currentUserId = req.user?.id;

  try {
    if (!currentUserId) {
      return error(res, new Error("Authentication required"), 401);
    }

    const { password } = req.body;
    if (!password || password.length < 8) {
      return error(res, new Error("Password must be at least 8 characters"), 400);
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.users.update({
      where: { id: currentUserId },
      data: { password: hashed, updated_at: new Date() },
    });

    logInfo("Password set for premium login", { userId: currentUserId.toString() });

    return success(res, null, "Password set. You can now log in with your email and password to access premium tests (once your account is upgraded).");
  } catch (err) {
    logError("Set password failed", err, { userId: currentUserId?.toString() });
    return error(res, err, 500);
  }
};

// 🔐 Google OAuth Callback Handler
export const googleAuthCallback = async (req, res) => {
  return handleOAuthCallback(req, res, 'Google');
};

// 🔐 Facebook OAuth Callback Handler
export const facebookAuthCallback = async (req, res) => {
  return handleOAuthCallback(req, res, 'Facebook');
};

// ❌ OAuth Failure Handler (Generic)
export const oauthFailure = (req, res) => {
  const failureError = new Error('OAuth authentication failed');
  logError('OAuth failure handler triggered', failureError);
  error(res, failureError, 401);

  res.redirect(
    `${process.env.FRONTEND_URL}/signin?error=authentication_failed`
  );
};

// Backward compatibility
export const googleAuthFailure = oauthFailure;
export const facebookAuthFailure = oauthFailure;
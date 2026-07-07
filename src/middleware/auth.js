// middleware/auth.js
import { prisma } from "../config/prismaClient.js";
import { error } from "../utils/response.js";
import jwt from "jsonwebtoken";

const USER_MODEL_TYPE = "App\\Models\\User";

/**
 * Verify JWT token and attach user with roles to request
 */
export const authenticate = async (req, res, next) => {
  try {
    console.log('🔐 Auth Middleware - Request:', {
      method: req.method,
      url: req.url,
      path: req.path,
      hasAuthHeader: !!req.headers.authorization
    });

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error('❌ Auth Middleware - No token provided');
      return error(res, new Error("No token provided"), 401);
    }

    const token = authHeader.split(" ")[1];
    console.log('🔐 Auth Middleware - Token received:', {
      tokenLength: token?.length,
      tokenPreview: token?.substring(0, 20) + '...'
    });

    if (!process.env.JWT_SECRET) {
      console.error('❌ Auth Middleware - JWT_SECRET not configured');
      throw new Error("JWT_SECRET is not configured");
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Auth Middleware - Token decoded:', {
      userId: decoded.id,
      email: decoded.email,
      roles: decoded.roles
    });

    // Fetch user
    const user = await prisma.users.findUnique({
      where: { id: BigInt(decoded.id) },
    });

    if (!user) {
      console.error('❌ Auth Middleware - User not found:', decoded.id);
      return error(res, new Error("User not found"), 404);
    }

    console.log('✅ Auth Middleware - User found:', {
      userId: user.id.toString(),
      email: user.email,
      status: user.status
    });

    // Auto-expire: check if access_given_at + duration has passed
    if (user.access_given_at && user.duration) {
      const durationDays = { '1': 15, '2': 30, '3': 60, '4': 90 };
      const days = durationDays[user.duration];
      if (days) {
        const expiresAt = new Date(user.access_given_at);
        expiresAt.setDate(expiresAt.getDate() + days);
        if (new Date() > expiresAt) {
          // Best-effort deactivation — don't block the 403 if DB update fails
          prisma.users.update({
            where: { id: user.id },
            data: { status: '0', is_user_paid: false, updated_at: new Date() },
          }).catch(e => console.error('❌ Auth Middleware - Failed to deactivate expired user:', e.message));
          console.error('❌ Auth Middleware - Subscription expired');
          return error(res, new Error("Your subscription has expired. Please renew to continue."), 403);
        }
      }
    }

    if (user.status !== "1") {
      console.error('❌ Auth Middleware - User account inactive');
      return error(res, new Error("User account is inactive"), 403);
    }

    // ✅ Fetch roles separately
    const userRoles = await prisma.model_has_roles.findMany({
      where: {
        model_id: user.id,
        model_type: USER_MODEL_TYPE,
      },
      include: {
        roles: true,
      },
    });

    // Extract role names
    const roles = userRoles.map((mhr) => mhr.roles.name);
    console.log('✅ Auth Middleware - Roles fetched:', roles);

    // Attach user with roles to request. loginMethod reflects how THIS
    // session was authenticated (from the signed JWT, not the account's
    // stored auth_provider, which can change if they also link Google) —
    // premium test access is gated on this being 'email'.
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      authProvider: user.auth_provider,
      loginMethod: decoded.loginMethod,
      roles,
      isAdmin: roles.includes("admin"),
      isUserPaid: user.is_user_paid,
    };

    console.log('✅ Auth Middleware - Authentication successful');
    next();
  } catch (err) {
    console.error('❌ Auth Middleware - Error:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });

    if (err.name === "JsonWebTokenError") {
      return error(res, new Error("Invalid token"), 401);
    }
    if (err.name === "TokenExpiredError") {
      return error(res, new Error("Token expired"), 401);
    }
    return error(res, err, 500);
  }
};

/**
 * Check if user has required role(s) - OR logic
 * @param {...string} roles - Role name(s) required
 */
export const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(
        res,
        new Error("Authentication required. Use authenticate middleware first."),
        401
      );
    }

    const userRoles = req.user.roles || [];
    const requiredRoles = roles.flat();

    const hasRequiredRole = requiredRoles.some((role) =>
      userRoles.includes(role)
    );
console.log(hasRequiredRole,userRoles,requiredRoles)
    if (!hasRequiredRole) {
      return error(
        res,
        new Error(
          `Insufficient permissions. Required role(s): ${requiredRoles.join(", ")}`
        ),
        403
      );
    }

    next();
  };
};

/**
 * Check if user has ALL of the required roles (AND logic)
 */
export const hasAllRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(
        res,
        new Error("Authentication required. Use authenticate middleware first."),
        401
      );
    }

    const userRoles = req.user.roles || [];
    const requiredRoles = roles.flat();

    const hasAllRequiredRoles = requiredRoles.every((role) =>
      userRoles.includes(role)
    );

    if (!hasAllRequiredRoles) {
      return error(
        res,
        new Error(
          `Insufficient permissions. Required all roles: ${requiredRoles.join(", ")}`
        ),
        403
      );
    }

    next();
  };
};

/**
 * Shortcut: Check if user is admin
 */
export const isAdmin = (req, res, next) => {
  return hasRole("Admin")(req, res, next);
};

/**
 * Shortcut: Check if user is regular user
 */
export const isUser = (req, res, next) => {
  return hasRole("User")(req, res, next);
};

/**
 * Check if user is the owner of the resource OR has admin role
 */
export const isOwnerOrAdmin = (userIdField = "userId") => {
  return (req, res, next) => {
    if (!req.user) {
      return error(
        res,
        new Error("Authentication required. Use authenticate middleware first."),
        401
      );
    }

    const resourceUserId = BigInt(
      req.params[userIdField] || req.body[userIdField]
    );
    const currentUserId = req.user.id;

    if (resourceUserId !== currentUserId && !req.user.isAdmin) {
      return error(
        res,
        new Error("You can only access your own resources"),
        403
      );
    }

    next();
  };
};

/**
 * Optional authentication - attaches user if token is valid, doesn't fail if no token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.users.findUnique({
      where: { id: BigInt(decoded.id) },
    });

    if (user && user.status === "1") {
      // Fetch roles separately
      const userRoles = await prisma.model_has_roles.findMany({
        where: {
          model_id: user.id,
          model_type: USER_MODEL_TYPE,
        },
        include: {
          roles: true,
        },
      });

      const roles = userRoles.map((mhr) => mhr.roles.name);

      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        authProvider: user.auth_provider,
        roles,
        isAdmin: roles.includes("Admin"),
        isUserPaid: user.is_user_paid,
      };
    }

    next();
  } catch (err) {
    // Token invalid, continue without user
    next();
  }
};

/**
 * Check if user has paid access for paid tests (type=2).
 * Fetches from database to avoid stale JWT token issues.
 * Requires authenticate middleware to run first.
 */
export const requirePaidForPaidTests = async (req, res, next) => {
  try {
    const testId = req.body.test_id || req.params.testId;
    if (!testId) return next();

    // Fetch the test to check its type
    const test = await prisma.tests.findUnique({
      where: { id: BigInt(testId) },
      select: { type: true }
    });

    if (!test) return error(res, new Error("Test not found"), 404);

    // type=1 is free, type=2 is paid
    if (test.type === 2) {
      if (req.user.loginMethod !== 'email') {
        return error(res, new Error("Please log in with your email and password to access premium tests."), 403);
      }

      const user = await prisma.users.findUnique({
        where: { id: req.user.id },
        select: { is_user_paid: true }
      });

      if (!user || !user.is_user_paid) {
        return error(res, new Error("Premium subscription required to access this test"), 403);
      }
    }

    next();
  } catch (err) {
    console.error('❌ Paid test access check failed:', err.message);
    return error(res, new Error("Failed to verify test access"), 500);
  }
};
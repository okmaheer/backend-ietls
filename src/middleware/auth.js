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
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return error(res, new Error("No token provided"), 401);
    }

    const token = authHeader.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user
    const user = await prisma.users.findUnique({
      where: { id: BigInt(decoded.id) },
    });

    if (!user) {
      return error(res, new Error("User not found"), 404);
    }

    if (user.status !== "1") {
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

    // Attach user with roles to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      authProvider: user.auth_provider,
      roles,
      isAdmin: roles.includes("admin"),
    };

    next();
  } catch (err) {
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
      };
    }

    next();
  } catch (err) {
    // Token invalid, continue without user
    next();
  }
};
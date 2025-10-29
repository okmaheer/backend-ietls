// utils/roleHelper.js
import { prisma } from "../config/prismaClient.js";

/**
 * Role constants matching your database
 */
export const ROLES = {
  ADMIN: "Admin",
  USER: "User",
};

/**
 * Model type constant for Laravel compatibility
 * This matches the Laravel model namespace in your database
 */
export const USER_MODEL_TYPE = "App\\Models\\User";

/**
 * Default role for new users
 */
export const DEFAULT_ROLE = ROLES.USER;

/**
 * Get user roles by user ID
 * @param {BigInt|number|string} userId - User ID
 * @returns {Promise<string[]>} Array of role names
 */
export const getUserRoles = async (userId) => {
  try {
    const userRoles = await prisma.model_has_roles.findMany({
      where: {
        model_id: BigInt(userId),
        model_type: USER_MODEL_TYPE,
      },
      include: {
        roles: true,
      },
    });

    return userRoles.map((mhr) => mhr.roles.name);
  } catch (error) {
    console.error("Error fetching user roles:", error);
    return [];
  }
};

/**
 * Assign role to user
 * @param {BigInt|number|string} userId - User ID
 * @param {string} roleName - Role name (admin or user)
 */
export const assignRoleToUser = async (userId, roleName) => {
  try {
    // Find the role
    const role = await prisma.roles.findFirst({
      where: { name: roleName },
    });

    if (!role) {
      throw new Error(`Role '${roleName}' not found`);
    }

    // Check if user already has this role
    const existingRole = await prisma.model_has_roles.findFirst({
      where: {
        model_id: BigInt(userId),
        model_type: USER_MODEL_TYPE,
        role_id: role.id,
      },
    });

    if (existingRole) {
      return { success: false, message: "User already has this role" };
    }

    // Assign role
    await prisma.model_has_roles.create({
      data: {
        role_id: role.id,
        model_type: USER_MODEL_TYPE,
        model_id: BigInt(userId),
      },
    });

    return { success: true, message: "Role assigned successfully" };
  } catch (error) {
    throw error;
  }
};

/**
 * Remove role from user
 * @param {BigInt|number|string} userId - User ID
 * @param {string} roleName - Role name (admin or user)
 */
export const removeRoleFromUser = async (userId, roleName) => {
  try {
    const role = await prisma.roles.findFirst({
      where: { name: roleName },
    });

    if (!role) {
      throw new Error(`Role '${roleName}' not found`);
    }

    const result = await prisma.model_has_roles.deleteMany({
      where: {
        model_id: BigInt(userId),
        model_type: USER_MODEL_TYPE,
        role_id: role.id,
      },
    });

    return {
      success: true,
      message: "Role removed successfully",
      count: result.count,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get user with all roles
 * @param {BigInt|number|string} userId - User ID
 */
export const getUserWithRoles = async (userId) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: BigInt(userId) },
    });

    if (!user) {
      return null;
    }

    const roles = await getUserRoles(userId);

    return {
      ...user,
      roles,
      isAdmin: roles.includes(ROLES.ADMIN),
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Check if user has specific role
 * @param {BigInt|number|string} userId - User ID
 * @param {string} roleName - Role name
 */
export const userHasRole = async (userId, roleName) => {
  try {
    const roles = await getUserRoles(userId);
    return roles.includes(roleName);
  } catch (error) {
    throw error;
  }
};

/**
 * Check if user is admin
 * @param {BigInt|number|string} userId - User ID
 */
export const userIsAdmin = async (userId) => {
  return await userHasRole(userId, ROLES.ADMIN);
};

/**
 * Get all users with a specific role
 * @param {string} roleName - Role name (admin or user)
 */
export const getUsersByRole = async (roleName) => {
  try {
    const role = await prisma.roles.findFirst({
      where: { name: roleName },
    });

    if (!role) {
      return [];
    }

    const modelHasRoles = await prisma.model_has_roles.findMany({
      where: {
        role_id: role.id,
        model_type: USER_MODEL_TYPE,
      },
    });

    const userIds = modelHasRoles.map((mhr) => mhr.model_id);

    const users = await prisma.users.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        created_at: true,
      },
    });

    return users;
  } catch (error) {
    throw error;
  }
};
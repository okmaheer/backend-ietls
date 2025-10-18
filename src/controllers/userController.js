import { prisma } from "../config/prismaClient.js";
import { success, error } from "../utils/response.js";

// 🧾 Get all users
export const getUsers = async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      include: { user_details: true },
      orderBy: { id: "desc" },
    });
    success(res, users, "Users fetched successfully");
  } catch (err) {
    console.error(err);

    res.status(500).json({ 
      success: false,
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        clientVersion: error.clientVersion,
        meta: error.meta,
        stack: error.stack,
        fullError: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)))
      },
    });  }
};

// ➕ Create user
export const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, country } = req.body;
    const user = await prisma.users.create({
      data: {
        name,
        email,
        password,
        phone,
        country,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    success(res, user, "User created successfully");
  } catch (err) {
    console.error(err);
    error(res, "Failed to create user");
  }
};

// 🧍‍♂️ Get single user
export const getUserById = async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const user = await prisma.users.findUnique({
      where: { id },
      include: { user_details: true },
    });
    if (!user) return error(res, "User not found", 404);
    success(res, user);
  } catch (err) {
    console.error(err);
    error(res);
  }
};

// 📝 Update user
export const updateUser = async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const user = await prisma.users.update({
      where: { id },
      data: { ...req.body, updated_at: new Date() },
    });
    success(res, user, "User updated successfully");
  } catch (err) {
    console.error(err);
    error(res, "Failed to update user");
  }
};

// ❌ Delete user
export const deleteUser = async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.users.delete({ where: { id } });
    success(res, null, "User deleted successfully");
  } catch (err) {
    console.error(err);
    error(res, "Failed to delete user");
  }
};

import { prisma } from "../config/prismaClient.js";
import { success, error } from "../utils/response.js";

// 🧾 Get all tests
export const getTests = async (req, res) => {
  try {
    const tests = await prisma.tests.findMany({ orderBy: { id: "desc" } });
    success(res, tests, "Tests fetched successfully");
  } catch (err) {
    console.error(err);
    error(res, "Failed to fetch tests");
  }
};

// ➕ Create test
export const createTest = async (req, res) => {
  try {
    const { name, type, category, status } = req.body;
    const test = await prisma.tests.create({
      data: {
        name,
        type,
        category,
        status,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    success(res, test, "Test created successfully");
  } catch (err) {
    console.error(err);
    error(res, "Failed to create test");
  }
};

// 🧍 Get single test
export const getTestById = async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const test = await prisma.tests.findUnique({ where: { id } });
    if (!test) return error(res, "Test not found", 404);
    success(res, test);
  } catch (err) {
    console.error(err);
    error(res);
  }
};

// 📝 Update test
export const updateTest = async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const test = await prisma.tests.update({
      where: { id },
      data: { ...req.body, updated_at: new Date() },
    });
    success(res, test, "Test updated successfully");
  } catch (err) {
    console.error(err);
    error(res, "Failed to update test");
  }
};

// ❌ Delete test
export const deleteTest = async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.tests.delete({ where: { id } });
    success(res, null, "Test deleted successfully");
  } catch (err) {
    console.error(err);
    error(res, "Failed to delete test");
  }
};

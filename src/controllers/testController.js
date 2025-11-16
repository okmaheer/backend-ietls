import { prisma } from "../config/prismaClient.js";
import { success, error } from "../utils/response.js";
import { logError, logInfo, logDebug } from "../utils/logger.js";

// 🧾 Get all tests
export const getTests = async (req, res) => {
  try {
    const tests = await prisma.tests.findMany({ orderBy: { id: "desc" } });
    logInfo('Tests fetched successfully', { count: tests.length });
    success(res, tests, "Tests fetched successfully");
  } catch (err) {
    logError("Failed to fetch tests", err, {
      method: req.method,
      url: req.originalUrl
    });
    error(res, "Failed to fetch tests");
  }
};

// ➕ Create test
export const createTest = async (req, res) => {
  try {
    const { name, type, category, status } = req.body;
    logDebug('Creating new test', { name, type, category, status });
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
    logInfo('Test created successfully', { testId: test.id.toString(), name });
    success(res, test, "Test created successfully");
  } catch (err) {
    logError("Failed to create test", err, {
      name: req.body.name,
      method: req.method,
      url: req.originalUrl
    });
    error(res, "Failed to create test");
  }
};

// 🧍 Get single test
export const getTestById = async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    logDebug('Fetching test by ID', { testId: id.toString() });
    const test = await prisma.tests.findUnique({ where: { id } });
    if (!test) {
      logDebug('Test not found', { testId: id.toString() });
      return error(res, "Test not found", 404);
    }
    logInfo('Test fetched successfully', { testId: id.toString() });
    success(res, test);
  } catch (err) {
    logError("Failed to fetch test", err, {
      testId: req.params.id,
      method: req.method,
      url: req.originalUrl
    });
    error(res);
  }
};

// 📝 Update test
export const updateTest = async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    logDebug('Updating test', { testId: id.toString() });
    const test = await prisma.tests.update({
      where: { id },
      data: { ...req.body, updated_at: new Date() },
    });
    logInfo('Test updated successfully', { testId: id.toString() });
    success(res, test, "Test updated successfully");
  } catch (err) {
    logError("Failed to update test", err, {
      testId: req.params.id,
      method: req.method,
      url: req.originalUrl
    });
    error(res, "Failed to update test");
  }
};

// ❌ Delete test
export const deleteTest = async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    logDebug('Deleting test', { testId: id.toString() });
    await prisma.tests.delete({ where: { id } });
    logInfo('Test deleted successfully', { testId: id.toString() });
    success(res, null, "Test deleted successfully");
  } catch (err) {
    logError("Failed to delete test", err, {
      testId: req.params.id,
      method: req.method,
      url: req.originalUrl
    });
    error(res, "Failed to delete test");
  }
};

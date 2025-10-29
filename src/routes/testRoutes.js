// routes/testRoutes.js
import express from "express";
import {
  getTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
} from "../controllers/testController.js";
import { authenticate, isAdmin, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// ✅ Public or authenticated users can view tests list
// Use optionalAuth if you want to show different content for logged-in users
router.get("/", optionalAuth, getTests);

// ✅ Authenticated users can view individual test details
router.get("/:id", authenticate, getTestById);

// ✅ Admin only - Create new test
router.post("/", authenticate, isAdmin, createTest);

// ✅ Admin only - Update test
router.put("/:id", authenticate, isAdmin, updateTest);

// ✅ Admin only - Delete test
router.delete("/:id", authenticate, isAdmin, deleteTest);

export default router;
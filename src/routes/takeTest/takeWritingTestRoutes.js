import express from "express";
import {
  getAcademicWritingTests,
  getGeneralTrainingWritingTests,
  getWritingTestDetails,
  submitWritingTest,
  getUserSubmissions,
  getSubmissionDetails,
  getSubmissionMeta
} from "../../controllers/takeTest/writingTestController.js";
import { authenticate, optionalAuth, requirePaidForPaidTests } from "../../middleware/auth.js";

const router = express.Router();

// Public routes (with optional auth to include user submissions if logged in)
router.get("/academic-writing-test", optionalAuth, getAcademicWritingTests);
router.get("/general-training-writing-test", optionalAuth, getGeneralTrainingWritingTests);

// Protected routes (require authentication) - MUST come before /:testId wildcard
router.post("/submit", authenticate, requirePaidForPaidTests, submitWritingTest);
router.get("/submissions", authenticate, getUserSubmissions);
router.get("/submission/:submissionId", authenticate, getSubmissionDetails);
router.get("/submission/:submissionId/meta", getSubmissionMeta);

// Wildcard route - MUST be last
router.get("/:testId", getWritingTestDetails);

export default router;
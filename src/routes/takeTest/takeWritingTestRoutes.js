import express from "express";
import {
  getAcademicWritingTests,
  getGeneralTrainingWritingTests,
  getWritingTestDetails
} from "../../controllers/takeTest/writingTestController.js";

const router = express.Router();

router.get("/academic-writing-test", getAcademicWritingTests);
router.get("/general-training-writing-test", getGeneralTrainingWritingTests);
// Get specific test details with questions
router.get("/:testId", getWritingTestDetails);

// Protected routes (require authentication)
// router.post("/submit", authenticate, submitWritingTest);
// router.get("/submissions", authenticate, getUserSubmissions);
// router.get("/submission/:submissionId", authenticate, getSubmissionDetails);

export default router;
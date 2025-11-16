import express from "express";
import {
  requestExpertReview,
  getUserReviewRequests,
  getReviewRequestDetails,
  checkExpertReviewStatus,
  getAllReviewRequests,
  getReviewRequestDetailsAdmin,
  submitExpertReview,
  updateReviewRequestStatus
} from "../../controllers/takeTest/expertReviewController.js";
import { authenticate } from "../../middleware/auth.js";

const router = express.Router();

// User routes (require authentication)
router.post("/request", authenticate, requestExpertReview);
router.get("/my-requests", authenticate, getUserReviewRequests);
router.get("/request/:requestId", authenticate, getReviewRequestDetails);
router.get("/check/:submissionId", authenticate, checkExpertReviewStatus);

// Admin routes (require authentication and admin role)
router.get("/admin/all", authenticate, getAllReviewRequests);
router.get("/admin/request/:requestId", authenticate, getReviewRequestDetailsAdmin);
router.post("/admin/request/:requestId/submit", authenticate, submitExpertReview);
router.patch("/admin/request/:requestId/status", authenticate, updateReviewRequestStatus);

export default router;

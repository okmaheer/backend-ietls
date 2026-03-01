import express from "express";
import {
  initiatePayment,
  paymentCallback,
  getPaymentStatus,
  getSubscriptionInfo
} from "../controllers/paymentController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Public route - Swichnow callback (no auth needed, gateway calls this)
router.get("/callback", paymentCallback);
router.post("/callback", paymentCallback);

// Protected routes
router.post("/initiate", authenticate, initiatePayment);
router.get("/status/:transactionId", authenticate, getPaymentStatus);

// Subscription info (public - so modal can be shown to anyone)
router.get("/subscription-info", getSubscriptionInfo);

export default router;

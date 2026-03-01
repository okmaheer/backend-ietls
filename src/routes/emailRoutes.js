/**
 * Email Routes — IELTS Pro
 *
 * Mounted at: /api/email
 *
 * Endpoints:
 *   GET  /api/email/health  → No auth — service health check
 *   POST /api/email/send    → Requires x-api-key header
 */

import { Router } from "express";
import { apiKeyAuth } from "../middleware/apiKeyAuth.js";
import { sendEmailHandler, emailHealthHandler } from "../controllers/emailController.js";

const router = Router();

// ── Public ──────────────────────────────────────────────────────
// Health check — useful for third parties to verify the service is live
router.get("/health", emailHealthHandler);

// ── Protected (API Key) ─────────────────────────────────────────
// Send email — requires x-api-key header
router.post("/send", apiKeyAuth, sendEmailHandler);

export default router;

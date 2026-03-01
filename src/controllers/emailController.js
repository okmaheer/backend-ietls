/**
 * Email Controller — IELTS Pro
 *
 * Handles REST requests to the email service endpoints.
 */

import { sendEmail } from "../services/emailService.js";

/**
 * POST /api/email/send
 *
 * Send a branded email. All content is flexible — no fixed templates.
 *
 * Required body fields:
 *   - to       {string|string[]}  Recipient email(s)
 *   - subject  {string}           Email subject
 *   - body     {string}           Main content (HTML supported)
 *
 * Optional body fields:
 *   - title       {string}           Bold headline shown in the header bar
 *   - previewText {string}           Short preview visible in email clients
 *   - button      {object}           CTA button: { text, url }
 *   - footerNote  {string}           Small note at the bottom
 *   - replyTo     {string}           Reply-to email address
 */
export async function sendEmailHandler(req, res) {
  const { to, subject, body, title, previewText, button, footerNote, replyTo } = req.body;

  // ── Validation ──────────────────────────────────────────────
  const errors = [];

  if (!to) errors.push("'to' is required");
  if (!subject || subject.trim() === "") errors.push("'subject' is required");
  if (!body || body.trim() === "") errors.push("'body' is required");

  if (to) {
    const recipients = Array.isArray(to) ? to : [to];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalid = recipients.filter((e) => !emailRegex.test(e));
    if (invalid.length > 0) {
      errors.push(`Invalid email address(es): ${invalid.join(", ")}`);
    }
  }

  if (button) {
    if (!button.text || !button.url) {
      errors.push("'button' must have both 'text' and 'url' fields");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors.join(". ") });
  }

  // ── Send ─────────────────────────────────────────────────────
  try {
    const result = await sendEmail({
      to,
      subject: subject.trim(),
      title,
      body,
      button,
      previewText,
      footerNote,
      replyTo,
    });

    return res.status(200).json({
      success: true,
      message: "Email sent successfully.",
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("❌ Email send failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to send email. Please check SMTP configuration.",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
}

/**
 * GET /api/email/health
 *
 * Confirm the email service is reachable (no auth required).
 * Does NOT test the SMTP connection — just confirms the route is live.
 */
export function emailHealthHandler(req, res) {
  const configured = !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.EMAIL_API_KEY
  );

  res.status(200).json({
    success: true,
    service: "Email Service",
    status: configured ? "operational" : "misconfigured — check env vars",
    timestamp: new Date().toISOString(),
  });
}

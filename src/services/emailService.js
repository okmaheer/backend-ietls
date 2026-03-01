/**
 * Email Service — IELTS Pro
 *
 * Standalone email service using Nodemailer + cPanel SMTP.
 *
 * Usage (anywhere inside the backend):
 *
 *   import { sendEmail } from "../services/emailService.js";
 *
 *   await sendEmail({
 *     to: "user@example.com",
 *     subject: "Your result is ready",
 *     title: "Result Ready!",
 *     body: "<p>Hello John, your IELTS writing score is now available.</p>",
 *     button: { text: "View Result", url: "https://yourdomain.com/results/123" },
 *     previewText: "Your IELTS writing result is ready to view.",
 *     footerNote: "If you did not request this, you can safely ignore this email.",
 *   });
 */

import nodemailer from "nodemailer";
import { buildEmailHtml } from "../templates/emailBase.js";

/**
 * Create and return a configured Nodemailer transporter using cPanel SMTP env vars.
 * A new transport is created per call — lightweight enough for a mail service.
 */
function createTransport() {
  const requiredVars = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"];
  const missing = requiredVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    throw new Error(`Email service: missing env vars: ${missing.join(", ")}`);
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "465", 10),
    secure: process.env.SMTP_SECURE !== "false", // true by default (port 465)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Some cPanel servers need this
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });
}

/**
 * Send a branded email.
 *
 * @param {object} options
 * @param {string|string[]} options.to          - Recipient email(s)
 * @param {string}           options.subject     - Email subject line
 * @param {string}          [options.title]      - Bold headline in the header bar
 * @param {string}           options.body        - Main content HTML
 * @param {object}          [options.button]     - CTA button { text: string, url: string }
 * @param {string}          [options.previewText]- Preview text shown in email clients
 * @param {string}          [options.footerNote] - Small note in the footer
 * @param {string}          [options.replyTo]    - Reply-to address
 *
 * @returns {Promise<{ success: boolean, messageId: string }>}
 * @throws  {Error} on SMTP failure
 */
export async function sendEmail({
  to,
  subject,
  title = "",
  body = "",
  button = null,
  previewText = "",
  footerNote = "",
  replyTo = null,
}) {
  const transporter = createTransport();

  const fromName = process.env.EMAIL_FROM_NAME || "IELTS Pro";
  const fromAddress = process.env.SMTP_USER;

  const html = buildEmailHtml({ previewText, title, body, button, footerNote });

  // Plain-text fallback (strip HTML tags for basic text)
  const text = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const mailOptions = {
    from: `"${fromName}" <${fromAddress}>`,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    html,
    text,
    ...(replyTo ? { replyTo } : {}),
  };

  const info = await transporter.sendMail(mailOptions);

  console.log(`✉️  Email sent → ${mailOptions.to} | messageId: ${info.messageId}`);

  return { success: true, messageId: info.messageId };
}

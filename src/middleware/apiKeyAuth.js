/**
 * API Key Authentication Middleware
 *
 * Validates the `x-api-key` header for the email service endpoint.
 * Used by third-party callers who don't have a JWT session.
 *
 * Set the key in .env:
 *   EMAIL_API_KEY=your-strong-random-key
 */

export function apiKeyAuth(req, res, next) {
  const key = req.headers["x-api-key"];

  if (!process.env.EMAIL_API_KEY) {
    console.error("❌ EMAIL_API_KEY is not set in environment variables.");
    return res.status(500).json({
      success: false,
      message: "Email service is not configured. Contact the administrator.",
    });
  }

  if (!key || key !== process.env.EMAIL_API_KEY) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. A valid x-api-key header is required.",
    });
  }

  next();
}

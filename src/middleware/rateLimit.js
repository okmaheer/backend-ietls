// middleware/rateLimit.js
import { error } from "../utils/response.js";

/**
 * Minimal in-memory rate limiter — no new dependency required.
 * Fine for a single-process deployment; swap for a Redis-backed limiter
 * if this ever runs behind multiple app instances.
 */
export function rateLimit({ windowMs, max, keyFn }) {
  const hits = new Map(); // key -> [timestamps]

  return (req, res, next) => {
    const key = keyFn(req);
    const now = Date.now();
    const timestamps = (hits.get(key) || []).filter((t) => now - t < windowMs);

    if (timestamps.length >= max) {
      return error(res, new Error("Too many attempts. Please try again later."), 429);
    }

    timestamps.push(now);
    hits.set(key, timestamps);
    next();
  };
}

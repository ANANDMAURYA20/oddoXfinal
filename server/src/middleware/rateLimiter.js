const rateLimit = require("express-rate-limit");

/**
 * Global API rate limiter
 * Limits every IP to 1000 requests per 15 minutes.
 * Prevents basic DDoS and excessive polling.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, 
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
    errors: [],
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Strict rate limiter for Authentication routes.
 * Limits every IP to 10 login/register attempts per 10 minutes.
 * Prevents brute-force password attacks.
 */
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again after 10 minutes",
    errors: [],
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { globalLimiter, authLimiter };

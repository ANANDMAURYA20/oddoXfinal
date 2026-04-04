require("dotenv").config();

const env = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || "fallback-secret-change-me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL || "admin@pos.com",
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD || "Admin@123",
  REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || "OddoPOS <noreply@oddopos.com>",
};

// Validate required vars
const required = ["DATABASE_URL", "JWT_SECRET"];
for (const key of required) {
  if (!env[key] || env[key].includes("fallback")) {
    console.warn(`⚠️  Warning: ${key} is not set in environment variables.`);
  }
}

module.exports = env;

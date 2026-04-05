const nodemailer = require("nodemailer");
const env = require("../config/env");

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content
 */
const sendEmail = async ({ to, subject, text, html }) => {
  // If credentials are missing in development, log and bypass
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    if (env.NODE_ENV !== "production") {
      console.log("------------------------------------------");
      console.log("📧 EMAIL PREVIEW (Missing Credentials)");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${text}`);
      console.log("------------------------------------------");
      return { preview: true };
    }
    throw new Error("SMTP credentials are required in production");
  }

  try {
    const info = await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    if (env.NODE_ENV === "production") {
      throw error;
    }
  }
};

/**
 * Send OTP Email
 * @param {string} to
 * @param {string} otp
 * @param {string} type - 'SIGNUP' | 'FORGOT_PASSWORD'
 */
const sendOtpEmail = async (to, otp, type) => {
  const subject = type === "SIGNUP" ? "Verify your email - OddoPOS" : "Reset your password - OddoPOS";

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #4f46e5; text-align: center;">OddoPOS</h2>
      <p>Hello,</p>
      <p>Your verification code for <strong>${type === "SIGNUP" ? "Registration" : "Password Reset"}</strong> is:</p>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b; border-radius: 8px; margin: 20px 0;">
        ${otp}
      </div>
      <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="text-align: center; color: #94a3b8; font-size: 12px;">OddoPOS &copy; ${new Date().getFullYear()} &middot; Powered by OddoXindus</p>
    </div>
  `;

  // In development, always log the OTP to console for easy access
  if (env.NODE_ENV !== "production") {
    console.log("------------------------------------------");
    console.log(`🔐 OTP for ${to}: ${otp} (${type})`);
    console.log("------------------------------------------");
  }

  return sendEmail({ to, subject, text: `Your OTP is: ${otp}`, html });
};

module.exports = { sendEmail, sendOtpEmail };

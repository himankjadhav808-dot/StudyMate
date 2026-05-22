require('dotenv').config();
const nodemailer = require('nodemailer');

// ── Build transporter lazily so .env values are always loaded first ───────────
const createTransporter = () => {
  const { EMAIL, EMAIL_PASS } = process.env;

  if (!EMAIL || !EMAIL_PASS) {
    throw new Error('EMAIL and EMAIL_PASS must be set in .env');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL,
      pass: EMAIL_PASS,   // Gmail App Password (16 chars, no spaces)
    },
  });
};

// ── Generic send helper ───────────────────────────────────────────────────────
const sendMail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"StudyMate" <${process.env.EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`✉️  Email sent to ${to}`);
    return true;
  } catch (err) {
    console.error('📧 Email error:', err.message);
    return false;
  }
};

// ── Signup / account-verification OTP ────────────────────────────────────────
const sendVerificationOTP = ({ email, otp }) => {
  console.log(`🔑 [Signup OTP] ${email} → ${otp}`);   // always visible in server logs
  return sendMail({
    to: email,
    subject: 'StudyMate – Email Verification Code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;
                  border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#0f766e;margin-bottom:4px;">Verify your email</h2>
        <p style="color:#374151;">Your one-time verification code is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:12px;
                    color:#db2777;margin:16px 0;">${otp}</div>
        <p style="color:#6b7280;font-size:13px;">
          This code expires in <strong>5 minutes</strong>. Do not share it with anyone.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;"/>
        <p style="color:#9ca3af;font-size:12px;">
          If you did not create a StudyMate account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
};

// ── Forgot-password OTP ───────────────────────────────────────────────────────
const sendPasswordResetOTP = ({ email, otp }) => {
  console.log(`🔑 [Reset OTP] ${email} → ${otp}`);    // always visible in server logs
  return sendMail({
    to: email,
    subject: 'StudyMate – Password Reset Code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;
                  border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#7c3aed;margin-bottom:4px;">Reset your password</h2>
        <p style="color:#374151;">Your one-time password reset code is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:12px;
                    color:#7c3aed;margin:16px 0;">${otp}</div>
        <p style="color:#6b7280;font-size:13px;">
          This code expires in <strong>5 minutes</strong>. Do not share it with anyone.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;"/>
        <p style="color:#9ca3af;font-size:12px;">
          If you did not request a password reset, please ignore this email.
        </p>
      </div>
    `,
  });
};

module.exports = { sendMail, sendVerificationOTP, sendPasswordResetOTP };

const bcrypt = require('bcryptjs');
const Learner = require('../models/Learner');
const OTP = require('../models/OTP');
const { sendPasswordResetOTP } = require('../service/emailService');

// ── Helper: generate 6-digit OTP ─────────────────────────────────────────────
const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

// ── Validate email format ─────────────────────────────────────────────────────
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — POST /api/auth/forgot-password
//   Body: { email }
// ─────────────────────────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email))
      return res.status(400).json({ success: false, message: 'A valid email is required.' });

    const learner = await Learner.findOne({ email: email.toLowerCase() });

    // Intentionally vague message to prevent email enumeration
    if (!learner)
      return res.status(200).json({ success: true, message: 'If that email exists, an OTP has been sent.' });

    const otp = generateOTP();

    // Replace any existing OTP for this email
    await OTP.deleteMany({ email: email.toLowerCase() });
    await OTP.create({ email: email.toLowerCase(), otp });

    const sent = await sendPasswordResetOTP({ email: learner.email, otp });

    if (!sent)
      return res.status(500).json({ success: false, message: 'Failed to send OTP email. Please try again.' });

    return res.status(200).json({ success: true, message: 'OTP sent to your email. It expires in 5 minutes.' });

  } catch (err) {
    console.error('forgotPassword error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — POST /api/auth/verify-otp
//   Body: { email, otp }
// ─────────────────────────────────────────────────────────────────────────────
const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });

    const record = await OTP.findOne({ email: email.toLowerCase(), otp: String(otp) });

    if (!record)
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });

    // OTP is valid — frontend may now call /reset-password
    return res.status(200).json({ success: true, message: 'OTP verified. You may now reset your password.' });

  } catch (err) {
    console.error('verifyResetOTP error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — POST /api/auth/reset-password
//   Body: { email, otp, newPassword }
//   Requires the OTP again to prevent skipping step 2
// ─────────────────────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword)
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required.' });

    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

    // Re-validate OTP before allowing password change
    const record = await OTP.findOne({ email: email.toLowerCase(), otp: String(otp) });

    if (!record)
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please request a new one.' });

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user
    const result = await Learner.updateOne(
      { email: email.toLowerCase() },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount === 0)
      return res.status(404).json({ success: false, message: 'User not found.' });

    // Invalidate OTP after successful reset
    await OTP.deleteMany({ email: email.toLowerCase() });

    return res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });

  } catch (err) {
    console.error('resetPassword error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { forgotPassword, verifyResetOTP, resetPassword };

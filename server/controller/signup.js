const bcrypt = require('bcryptjs');
const Learner = require('../models/Learner');
const OTP = require('../models/OTP');
const { sendVerificationOTP } = require('../service/emailService');

// ── Helper: generate 6-digit OTP ─────────────────────────────────────────────
const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

// ── Validate email format ─────────────────────────────────────────────────────
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ── Shared: create OTP record and send email ──────────────────────────────────
const issueOTP = async (email) => {
  const otp = generateOTP();
  await OTP.deleteMany({ email });
  await OTP.create({ email, otp });
  return { otp, sent: await sendVerificationOTP({ email, otp }) };
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /signup
// ─────────────────────────────────────────────────────────────────────────────
const saveRecord = async (req, res) => {
  try {
    const { fname, lname, email, password } = req.body;

    // ── Input validation ──────────────────────────────────────────────────────
    if (!fname || !lname || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields are required.' });

    if (!isValidEmail(email))
      return res.status(400).json({ success: false, message: 'Invalid email format.' });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

    const normalEmail = email.toLowerCase();
    const existing = await Learner.findOne({ email: normalEmail });

    if (existing && existing.verified) {
      // Fully verified account — block re-registration
      return res.status(409).json({ success: false, message: 'An account with this email already exists. Please login.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let learner;
    if (existing && !existing.verified) {
      // Unverified account exists — update credentials and resend OTP
      existing.fname = fname;
      existing.lname = lname;
      existing.password = hashedPassword;
      await existing.save();
      learner = existing;
    } else {
      // Fresh registration
      learner = await Learner.create({
        fname, lname,
        email: normalEmail,
        password: hashedPassword,
        verified: false,
        role: 'user',
        createdAt: new Date(),
      });
    }

    const { sent } = await issueOTP(normalEmail);

    if (!sent) {
      if (!existing) await Learner.deleteOne({ _id: learner._id });
      return res.status(500).json({ success: false, message: 'Failed to send verification email. Please try again.' });
    }

    return res.status(201).json({
      success: true,
      message: 'Account created. Please check your email for the verification code.',
      email: normalEmail,
    });

  } catch (err) {
    console.error('Signup error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /resend-otp — resend signup verification OTP
// ─────────────────────────────────────────────────────────────────────────────
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const learner = await Learner.findOne({ email: email.toLowerCase() });
    if (!learner) return res.status(404).json({ success: false, message: 'No account found with this email.' });
    if (learner.verified) return res.status(400).json({ success: false, message: 'Account already verified. Please login.' });

    const { sent } = await issueOTP(email.toLowerCase());
    if (!sent) return res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });

    return res.status(200).json({ success: true, message: 'A new OTP has been sent to your email.' });
  } catch (err) {
    console.error('resendOTP error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { saveRecord, resendOTP };
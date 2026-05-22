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
// POST /signup/user - User signup
// ─────────────────────────────────────────────────────────────────────────────
const signupUser = async (req, res) => {
  try {
    const { fname, lname, email, password } = req.body;

    if (!fname || !lname || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields are required.' });

    if (!isValidEmail(email))
      return res.status(400).json({ success: false, message: 'Invalid email format.' });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

    const normalEmail = email.toLowerCase();
    const existing = await Learner.findOne({ email: normalEmail });

    if (existing && existing.verified) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists. Please login.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let learner;
    if (existing && !existing.verified) {
      existing.fname = fname;
      existing.lname = lname;
      existing.password = hashedPassword;
      existing.role = 'user';
      await existing.save();
      learner = existing;
    } else {
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
    console.error('User signup error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /signup/admin - Admin signup (requests approval)
// ─────────────────────────────────────────────────────────────────────────────
const signupAdmin = async (req, res) => {
  try {
    const { fname, lname, email, password } = req.body;

    if (!fname || !lname || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields are required.' });

    if (!isValidEmail(email))
      return res.status(400).json({ success: false, message: 'Invalid email format.' });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

    const normalEmail = email.toLowerCase();
    const existing = await Learner.findOne({ email: normalEmail });

    if (existing && (existing.verified || existing.role !== 'admin_pending')) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let learner;
    if (existing && !existing.verified) {
      existing.fname = fname;
      existing.lname = lname;
      existing.password = hashedPassword;
      existing.role = 'admin_pending';
      await existing.save();
      learner = existing;
    } else {
      learner = await Learner.create({
        fname, lname,
        email: normalEmail,
        password: hashedPassword,
        verified: false,
        role: 'admin_pending',
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
      message: 'Admin account request created. Please verify your email. Once verified, wait for super admin approval.',
      email: normalEmail,
    });
  } catch (err) {
    console.error('Admin signup error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { signupUser, signupAdmin };

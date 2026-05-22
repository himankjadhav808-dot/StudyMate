const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Learner = require('../models/Learner');
require('dotenv').config();

const { SECRET_KEY } = process.env;

// ── Validate email format ─────────────────────────────────────────────────────
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// POST /login
const login = async (req, res) => {
  try {
    const { email, password, loginType } = req.body;

    // ── Input validation ──────────────────────────────────────────────────────
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    if (!isValidEmail(email))
      return res.status(400).json({ success: false, message: 'Invalid email format.' });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

    // ── Fetch user ────────────────────────────────────────────────────────────
    const learner = await Learner.findOne({ email: email.toLowerCase() });

    if (!learner)
      return res.status(401).json({ success: false, message: 'No account found with this email.' });

    if (learner.blocked)
      return res.status(403).json({ success: false, message: 'This account has been blocked. Contact super admin.' });

    // ── Role / loginType mismatch check ───────────────────────────────────────
    const isAdminAccount = learner.role === 'admin' || learner.role === 'admin_pending';
    const wantsAdmin     = loginType === 'admin';

    if (wantsAdmin && !isAdminAccount)
      return res.status(403).json({ success: false, message: 'This account is not registered as an admin. Please use Student login.' });

    if (!wantsAdmin && isAdminAccount)
      return res.status(403).json({ success: false, message: 'Admin accounts must use the Admin login tab.' });

    // ── Compare password ──────────────────────────────────────────────────────
    const match = await bcrypt.compare(password, learner.password);

    if (!match)
      return res.status(401).json({ success: false, message: 'Incorrect password.' });

    // ── Issue JWT ─────────────────────────────────────────────────────────────
    const token = jwt.sign(
      { id: learner._id, email: learner.email, user: `${learner.fname} ${learner.lname}`, role: learner.role },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    // ── Set cookie + return token in body ─────────────────────────────────────
    const isProd = process.env.NODE_ENV === 'production';
    return res
      .status(200)
      .cookie('token', token, {
        maxAge: 3600000,
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'None' : 'Lax',
      })
      .json({
        success: true,
        message: 'Login successful.',
        token,
        user: { name: `${learner.fname} ${learner.lname}`, email: learner.email, role: learner.role },
      });

  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { login };
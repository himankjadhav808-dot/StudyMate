const express = require('express');
const router = express.Router();

const { forgotPassword, verifyResetOTP, resetPassword } = require('../controller/authController');

// POST /api/auth/forgot-password  — Step 1: request OTP
router.post('/forgot-password', forgotPassword);

// POST /api/auth/verify-otp       — Step 2: validate OTP
router.post('/verify-otp', verifyResetOTP);

// POST /api/auth/reset-password   — Step 3: set new password
router.post('/reset-password', resetPassword);

module.exports = router;

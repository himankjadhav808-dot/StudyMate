const OTP = require('../models/OTP');
const Learner = require('../models/Learner');

// Called internally from signup controller
const saveOTP = async ({ email, otp }) => {
  try {
    await OTP.deleteMany({ email: email.toLowerCase() }); // clear old OTPs
    await OTP.create({ email: email.toLowerCase(), otp });
  } catch (err) {
    console.error('saveOTP error:', err.message);
    throw err;
  }
};

// POST /verify  — verifies signup OTP and marks account as verified
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });

    const record = await OTP.findOne({ email: email.toLowerCase(), otp: String(otp) });

    if (!record)
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });

    await Learner.updateOne({ email: email.toLowerCase() }, { $set: { verified: true } });
    await OTP.deleteMany({ email: email.toLowerCase() }); // clean up after verification

    return res.status(200).json({ success: true, message: 'Email verified successfully.' });

  } catch (err) {
    console.error('verifyOTP error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { saveOTP, verifyOTP };
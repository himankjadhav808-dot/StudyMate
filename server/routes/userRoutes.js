const express = require('express');
const bcrypt = require('bcryptjs');
const { verifyJWT } = require('../middleware/rbac');
const Learner = require('../models/Learner');
const ContactMessage = require('../models/ContactMessage');
const { sendMail } = require('../service/emailService');

const router = express.Router();
router.use(verifyJWT);

router.get('/profile', async (req, res) => {
  try {
    const learner = await Learner.findById(req.user.id).select('-password');
    if (!learner) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: learner });
  } catch (err) {
    console.error('Profile fetch error:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching profile.' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { fname, lname, password } = req.body;
    const learner = await Learner.findById(req.user.id);
    if (!learner) return res.status(404).json({ success: false, message: 'User not found.' });

    if (fname) learner.fname = fname;
    if (lname) learner.lname = lname;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      }
      learner.password = await bcrypt.hash(password, 10);
    }

    await learner.save();
    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        name: `${learner.fname} ${learner.lname}`,
        email: learner.email,
        role: learner.role,
      }
    });
  } catch (err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ success: false, message: 'Error updating profile.' });
  }
});

router.delete('/profile', async (req, res) => {
  try {
    await Learner.findByIdAndDelete(req.user.id);
    res.json({ success: true, message: 'Your account has been deleted.' });
  } catch (err) {
    console.error('Profile delete error:', err.message);
    res.status(500).json({ success: false, message: 'Error deleting account.' });
  }
});

router.post('/contact', async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message are required.' });
    }

    const learner = await Learner.findById(req.user.id).select('fname lname email blocked');
    if (!learner) return res.status(404).json({ success: false, message: 'User not found.' });

    if (learner.blocked) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked. You cannot send messages.' });
    }

    const contactMessage = new ContactMessage({
      sender: learner._id,
      name: `${learner.fname} ${learner.lname}`,
      email: learner.email,
      subject,
      message,
    });

    await contactMessage.save();
    console.log(`✅ Contact message saved from ${learner.email}: "${subject}"`);

    // Use SUPER_ADMIN_EMAIL or fall back to EMAIL env var
    const adminEmail = process.env.SUPER_ADMIN_EMAIL || process.env.EMAIL;
    if (adminEmail) {
      try {
        await sendMail({
          to: adminEmail,
          subject: `StudyMate Support: ${subject}`,
          html: `<p><strong>From:</strong> ${learner.fname} ${learner.lname} (${learner.email})</p>
                 <p><strong>Subject:</strong> ${subject}</p>
                 <p><strong>Message:</strong></p>
                 <p>${message.replace(/\n/g, '<br/>')}</p>`
        });
        console.log(`📧 Email notification sent to ${adminEmail}`);
      } catch (mailErr) {
        console.warn('Contact mail saved but notification failed:', mailErr.message);
      }
    }

    res.json({ success: true, message: 'Your message has been sent to the admin team.' });
  } catch (err) {
    console.error('Contact save error:', err.message);
    res.status(500).json({ success: false, message: 'Error sending message.' });
  }
});

router.get('/contacts', async (req, res) => {
  try {
    const messages = await ContactMessage.find({ sender: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, messages });
  } catch (err) {
    console.error('Contact fetch error:', err.message);
    res.status(500).json({ success: false, message: 'Error loading your messages.' });
  }
});

module.exports = router;

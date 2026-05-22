const Learner = require('../models/Learner');

// ── GET /api/admin/requests - Fetch pending admin requests ───────────────────
const getPendingAdminRequests = async (req, res) => {
  try {
    const pendingAdmins = await Learner.find({ role: 'admin_pending' }).select('-password');
    res.json({ success: true, requests: pendingAdmins });
  } catch (err) {
    console.error('Error fetching admin requests:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching admin requests.' });
  }
};

// ── POST /api/admin/approve/:userId - Approve admin request ───────────────────
const approveAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const learner = await Learner.findById(userId);

    if (!learner)
      return res.status(404).json({ success: false, message: 'User not found.' });

    if (learner.role !== 'admin_pending')
      return res.status(400).json({ success: false, message: 'This user is not a pending admin.' });

    learner.role = 'admin';
    await learner.save();

    res.json({ success: true, message: `Admin approval granted to ${learner.email}`, user: learner });
  } catch (err) {
    console.error('Error approving admin:', err.message);
    res.status(500).json({ success: false, message: 'Error approving admin.' });
  }
};

// ── POST /api/admin/reject/:userId - Reject admin request ────────────────────
const rejectAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const learner = await Learner.findById(userId);

    if (!learner)
      return res.status(404).json({ success: false, message: 'User not found.' });

    if (learner.role !== 'admin_pending')
      return res.status(400).json({ success: false, message: 'This user is not a pending admin.' });

    learner.role = 'user';
    await learner.save();

    res.json({ success: true, message: `Admin request rejected for ${learner.email}. User converted to regular user.`, user: learner });
  } catch (err) {
    console.error('Error rejecting admin:', err.message);
    res.status(500).json({ success: false, message: 'Error rejecting admin.' });
  }
};

module.exports = { getPendingAdminRequests, approveAdmin, rejectAdmin };

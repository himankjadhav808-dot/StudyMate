const express = require('express');
const Learner = require('../models/Learner');
const AptitudeQ = require('../models/AptitudeQ');
const ReasoningQuestion = require('../models/ReasoningQuestion');
const { QuestionSetModel } = require('../models/Question');
const ContactMessage = require('../models/ContactMessage');
const { verifyJWT, isAdmin } = require('../middleware/rbac');
const { getPendingAdminRequests, approveAdmin, rejectAdmin } = require('../controller/adminManagement');
const { sendMail } = require('../service/emailService');

const router = express.Router();

// ── All admin routes require JWT verification and admin role ─────────────────
router.use(verifyJWT);
router.use(isAdmin);

// ── GET /api/admin/requests - Fetch pending admin requests ───────────────────
router.get('/requests', getPendingAdminRequests);

// ── POST /api/admin/approve/:userId ──────────────────────────────────────────
router.post('/approve/:userId', approveAdmin);

// ── POST /api/admin/reject/:userId ───────────────────────────────────────────
router.post('/reject/:userId', rejectAdmin);

// ── GET /api/admin/leaderboard ──────────────────────────────────────────────
router.get('/leaderboard', async (req, res) => {
  try {
    const learners = await Learner.find({ 
      verified: true, 
      role: 'user',
      email: { $ne: 'studymate809@gmail.com' }
    }).select('fname lname email results');
    const leaderboard = learners.map(learner => {
      const maxMarks = Math.max(...learner.results.map(r => r.marks || 0), 0);
      return {
        name: `${learner.fname} ${learner.lname}`,
        email: learner.email,
        maxMarks,
        exams: learner.results.length
      };
    }).sort((a, b) => b.maxMarks - a.maxMarks);
    res.json({ success: true, leaderboard });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching leaderboard.' });
  }
});

// ── GET /api/admin/users ────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const users = await Learner.find().select('-password');
    res.json({ success: true, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching users.' });
  }
});

// ── GET /api/admin/users/:userId/results ─────────────────────────────────────
router.get('/users/:userId/results', async (req, res) => {
  try {
    const user = await Learner.findById(req.params.userId).select('fname lname email results');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, results: user.results, user: { name: `${user.fname} ${user.lname}`, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching user results.' });
  }
});

// ── GET /api/admin/questions/:paperCode ───────────────────────────────────────
router.get('/questions/:paperCode', async (req, res) => {
  try {
    const { paperCode } = req.params;
    const questionSet = await QuestionSetModel.findOne({ paperCode: paperCode.toUpperCase() });
    if (!questionSet) {
      return res.status(404).json({ success: false, message: 'Question set not found.' });
    }
    res.json({ success: true, questionSet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching question set.' });
  }
});

// ── GET /api/admin/questions ────────────────────────────────────────────────
router.get('/questions', async (req, res) => {
  try {
    const aptitude = await AptitudeQ.find();
    const reasoning = await ReasoningQuestion.find();
    res.json({ success: true, questions: { aptitude, reasoning, general: [] } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching questions.' });
  }
});

// ── GET /api/admin/sessions - Fetch all admin-created question sessions
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await QuestionSetModel.find().sort({ createdAt: -1 });
    res.json({ success: true, sessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching sessions.' });
  }
});

// ── GET /api/admin/contacts - Admin view of user messages
router.get('/contacts', async (req, res) => {
  try {
    const contacts = await ContactMessage.find()
      .populate('sender', 'fname lname email')
      .sort({ createdAt: -1 });
    res.json({ success: true, contacts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching contacts.' });
  }
});

// ── PUT /api/admin/contacts/:id - Update contact status
router.put('/contacts/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['new', 'reviewed', 'resolved'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    const contact = await ContactMessage.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact message not found.' });
    }
    contact.status = status;
    await contact.save();
    res.json({ success: true, contact });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error updating contact status.' });
  }
});

// ── PUT /api/admin/sessions/:id - Update a session (super admin only)
router.put('/sessions/:id', async (req, res) => {
  try {
    // Check if user is super admin
    const user = await Learner.findById(req.user.id).select('email');
    if (!user || user.email !== 'studymate809@gmail.com') {
      return res.status(403).json({ success: false, message: 'Only super admin can edit sessions.' });
    }

    const { paperCode, paperName, level, timeLimit } = req.body;
    const session = await QuestionSetModel.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    if (paperCode && paperCode.trim().toUpperCase() !== session.paperCode) {
      const normalizedCode = paperCode.trim().toUpperCase();
      const existing = await QuestionSetModel.findOne({ paperCode: normalizedCode });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Session code already exists.' });
      }
      session.paperCode = normalizedCode;
    }

    if (paperName) session.paperName = paperName;
    if (level) session.level = level;
    if (timeLimit !== undefined && timeLimit !== null) {
      const parsed = Number(timeLimit);
      if (Number.isNaN(parsed) || parsed <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid time limit.' });
      }
      session.timeLimit = parsed * 60;
    }

    await session.save();
    res.json({ success: true, session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error updating session.' });
  }
});

// ── DELETE /api/admin/sessions/:id - Remove a session (super admin only)
router.delete('/sessions/:id', async (req, res) => {
  try {
    // Check if user is super admin
    const user = await Learner.findById(req.user.id).select('email');
    if (!user || user.email !== 'studymate809@gmail.com') {
      return res.status(403).json({ success: false, message: 'Only super admin can delete sessions.' });
    }

    const deleted = await QuestionSetModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }
    res.json({ success: true, message: 'Session deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error deleting session.' });
  }
});

// ── POST /api/admin/share ───────────────────────────────────────────────────
router.post('/share', async (req, res) => {
  const { topN, email } = req.body;
  try {
    const learners = await Learner.find({ 
      verified: true, 
      role: 'user',
      email: { $ne: 'studymate809@gmail.com' }
    }).select('fname lname email results');
    const leaderboard = learners.map(learner => {
      const maxMarks = Math.max(...learner.results.map(r => r.marks || 0), 0);
      return { name: `${learner.fname} ${learner.lname}`, maxMarks };
    }).sort((a, b) => b.maxMarks - a.maxMarks).slice(0, topN);

    const rows = leaderboard.map((s, i) =>
      `<tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
        <td style="padding:10px 16px;font-weight:bold;color:#374151">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</td>
        <td style="padding:10px 16px;color:#111827">${s.name}</td>
        <td style="padding:10px 16px;color:#0f766e;font-weight:bold;text-align:center">${s.maxMarks}</td>
      </tr>`
    ).join('');

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
        <div style="background:#0f766e;padding:20px 24px">
          <h2 style="color:#fff;margin:0;font-size:20px">🏆 StudyMate Leaderboard — Top ${topN}</h2>
          <p style="color:#99f6e4;margin:4px 0 0;font-size:13px">Shared by admin · ${new Date().toLocaleDateString()}</p>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f3f4f6">
              <th style="padding:10px 16px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase">Rank</th>
              <th style="padding:10px 16px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase">Name</th>
              <th style="padding:10px 16px;text-align:center;font-size:12px;color:#6b7280;text-transform:uppercase">Best Score</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="padding:16px 24px;background:#f9fafb;text-align:center">
          <p style="color:#9ca3af;font-size:12px;margin:0">Generated by StudyMate · studymate809@gmail.com</p>
        </div>
      </div>`;

    await sendMail({ to: email, subject: `🏆 StudyMate Top ${topN} Students`, html });
    res.json({ success: true, message: 'Shared successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error sharing.' });
  }
});

// ── POST /api/admin/users/:userId/block - Block a user (super admin only) ─────
router.post('/users/:userId/block', async (req, res) => {
  try {
    const superAdmin = await Learner.findById(req.user.id).select('email');
    if (!superAdmin || superAdmin.email !== 'studymate809@gmail.com') {
      return res.status(403).json({ success: false, message: 'Only super admin can block users.' });
    }

    const user = await Learner.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.email === 'studymate809@gmail.com') {
      return res.status(400).json({ success: false, message: 'Cannot block super admin.' });
    }

    user.blocked = true;
    await user.save();
    res.json({ success: true, message: 'User blocked successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error blocking user.' });
  }
});

// ── POST /api/admin/users/:userId/unblock - Unblock a user (super admin only) ─
router.post('/users/:userId/unblock', async (req, res) => {
  try {
    const superAdmin = await Learner.findById(req.user.id).select('email');
    if (!superAdmin || superAdmin.email !== 'studymate809@gmail.com') {
      return res.status(403).json({ success: false, message: 'Only super admin can unblock users.' });
    }

    const user = await Learner.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.blocked = false;
    await user.save();
    res.json({ success: true, message: 'User unblocked successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error unblocking user.' });
  }
});

// ── DELETE /api/admin/users/:userId - Delete a user (super admin only) ────────
router.delete('/users/:userId', async (req, res) => {
  try {
    const superAdmin = await Learner.findById(req.user.id).select('email');
    if (!superAdmin || superAdmin.email !== 'studymate809@gmail.com') {
      return res.status(403).json({ success: false, message: 'Only super admin can delete users.' });
    }

    const user = await Learner.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.email === 'studymate809@gmail.com') {
      return res.status(400).json({ success: false, message: 'Cannot delete super admin.' });
    }

    await Learner.findByIdAndDelete(req.params.userId);
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error deleting user.' });
  }
});

// ── DELETE /api/admin/admins/:userId - Delete an admin (super admin only) ─────
router.delete('/admins/:userId', async (req, res) => {
  try {
    const superAdmin = await Learner.findById(req.user.id).select('email');
    if (!superAdmin || superAdmin.email !== 'studymate809@gmail.com') {
      return res.status(403).json({ success: false, message: 'Only super admin can delete admins.' });
    }

    const admin = await Learner.findById(req.params.userId);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }

    if (admin.email === 'studymate809@gmail.com') {
      return res.status(400).json({ success: false, message: 'Cannot delete super admin.' });
    }

    if (!['admin', 'admin_pending'].includes(admin.role)) {
      return res.status(400).json({ success: false, message: 'User is not an admin.' });
    }

    await Learner.findByIdAndDelete(req.params.userId);
    res.json({ success: true, message: 'Admin deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error deleting admin.' });
  }
});

// ── GET /api/admin/sessions/:sessionCode/results ─────────────────────────────
// Returns all students who completed the test for this session.
// Ownership enforced: only the teacher who created the session (or super admin) can view.
router.get('/sessions/:sessionCode/results', async (req, res) => {
  try {
    const { sessionCode } = req.params;

    // Find the session by its join code
    const session = await QuestionSetModel.findOne({ sessionCode: sessionCode.toUpperCase() });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    // Ownership check — super admin can bypass
    const requestingUser = await Learner.findById(req.user.id).select('email');
    const isSuperAdmin = requestingUser?.email === 'studymate809@gmail.com';

    if (!isSuperAdmin && String(session.teacherId) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view results for sessions you created.',
      });
    }

    // Find all learners who have a result with this paperCode
    const learners = await Learner.find({
      'results.paperCode': session.paperCode,
    }).select('fname lname email results');

    // Extract only the matching result entry per learner
    const students = learners.map((learner) => {
      const result = learner.results.find((r) => r.paperCode === session.paperCode);
      return {
        name: `${learner.fname} ${learner.lname}`,
        email: learner.email,
        marks: result?.marks ?? 0,
        maxMarks: result?.maxMarks ?? 0,
        correct: result?.correct ?? 0,
        wrong: result?.wrong ?? 0,
        attempt: result?.attempt ?? 0,
        unattempt: result?.unattempt ?? 0,
        grade: result?.grade ?? 'N/A',
        takenAt: result?.takenAt ?? null,
      };
    });

    res.json({
      success: true,
      session: {
        paperName: session.paperName,
        paperCode: session.paperCode,
        sessionCode: session.sessionCode,
        level: session.level,
      },
      totalCompleted: students.length,
      students,
    });
  } catch (err) {
    console.error('[adminRoutes] session results error:', err);
    res.status(500).json({ success: false, message: 'Error fetching session results.' });
  }
});

module.exports = router;

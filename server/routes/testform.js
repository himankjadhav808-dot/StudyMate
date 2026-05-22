const express = require('express');
const router = express.Router();
const { QuestionSetModel } = require('../models/Question');
const { verifyJWT } = require('../middleware/rbac');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.set('strictQuery', true);

// ── Helpers ───────────────────────────────────────────────────────────────────

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Generate a random 6-character alphanumeric string */
function generateCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

/** Generate a sessionCode guaranteed to be unique in the DB */
async function uniqueSessionCode() {
  const MAX_ATTEMPTS = 10;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const code = generateCode();
    const existing = await QuestionSetModel.findOne({ sessionCode: code });
    if (!existing) return code;
  }
  throw new Error('Failed to generate a unique session code after multiple attempts.');
}

// ── Upload question set (teacher must be authenticated) ───────────────────────
router.post('/upload', verifyJWT, async (req, res) => {
  const { paperCode, paperName, level, timeLimit, totalQuestions, questionSet } = req.body;
  console.log('[testform] Upload request from user:', req.user?.id);

  // Basic validation — paperCode is still required as the human-readable paper identifier
  if (!paperCode || !paperName || !level || !Array.isArray(questionSet) || !timeLimit) {
    return res.status(400).json({ error: 'Missing required fields or invalid questionSet format' });
  }

  try {
    const normalizedCode = paperCode.trim().toUpperCase();
    const parsedTimeLimit = Number(timeLimit);

    if (Number.isNaN(parsedTimeLimit) || parsedTimeLimit <= 0) {
      return res.status(400).json({ error: 'Invalid time limit' });
    }

    // Auto-generate a unique 6-char alphanumeric session join code
    const sessionCode = await uniqueSessionCode();

    // Create and save the question set
    const newSet = new QuestionSetModel({
      paperCode: normalizedCode,
      paperName,
      level,
      timeLimit: parsedTimeLimit,
      totalQuestions,
      questionSet,
      sessionCode,
      teacherId: req.user.id,
    });

    await newSet.save();

    res.status(201).json({
      message: 'Question set uploaded successfully',
      sessionCode,           // return to frontend so teacher can share it
      paperCode: normalizedCode,
    });
  } catch (err) {
    console.error('[testform] Upload error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

module.exports = router;
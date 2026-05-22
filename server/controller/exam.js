const jwt = require('jsonwebtoken');
const { QuestionSetModel } = require('../models/Question');
const Learner = require('../models/Learner');
require('dotenv').config();

const { SECRET_KEY } = process.env;

const getQuestions = async (req, res) => {
  try {
    console.log("Fetching question set...");
    const joinCode = req.body?.joinCode || req.query?.joinCode || req.query?.code;
    let paper;

    if (joinCode) {
      const normalizedCode = String(joinCode).trim().toUpperCase();

      // ── Primary: look up by sessionCode (auto-generated 6-char join code) ──
      paper = await QuestionSetModel.findOne({ sessionCode: normalizedCode });

      // ── Fallback: legacy sessions may have been joined by paperCode ─────────
      if (!paper) {
        paper = await QuestionSetModel.findOne({ paperCode: normalizedCode });
      }

      if (!paper) {
        return res.status(404).json({ error: "No paper found for that join code." });
      }

      // ── Require authentication ──────────────────────────────────────────────
      const cookieToken = req.cookies?.token;
      const bearerToken = req.headers.authorization?.split(' ')[1];
      const token = cookieToken || bearerToken;

      if (!token) {
        return res.status(401).json({ error: "Authentication required to join this exam." });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, SECRET_KEY);
      } catch (err) {
        return res.status(401).json({ error: "Invalid session. Please login again." });
      }

      const learner = await Learner.findById(decoded.id).select('joinedExamCodes results');
      if (!learner) {
        return res.status(401).json({ error: "User not found." });
      }

      // ── Duplicate-join guard — keyed on sessionCode so same paper can be
      //    attempted in a different session ────────────────────────────────────
      const trackingKey = paper.sessionCode || normalizedCode;
      const hasJoinedBefore = learner.joinedExamCodes?.includes(trackingKey);

      if (hasJoinedBefore) {
        return res.status(403).json({ error: "You have already joined this exam session." });
      }

      // Record that this student has joined this session
      await Learner.findByIdAndUpdate(decoded.id, {
        $addToSet: { joinedExamCodes: trackingKey }
      });

    } else {
      paper = await QuestionSetModel
        .findOne()
        .sort({ createdAt: -1 });
    }

    if (!paper) {
      return res.status(404).json({ error: "No paper found" });
    }

    return res.status(200).json(paper);

  } catch (err) {
    console.error("Error fetching question set:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};


module.exports = { getQuestions };
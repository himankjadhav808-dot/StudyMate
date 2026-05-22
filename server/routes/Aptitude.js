const express = require("express");
const router = express.Router();
const AptitudeQuestion = require("../models/AptitudeQ");

// GET /api/aptitude?category=Percentages&difficulty=Easy
router.get("/", async (req, res) => {
  const { category } = req.query;

  try {
    const filter = category ? { category } : {};
    const questions = await AptitudeQuestion.find(filter);
    res.json(questions);
    
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch aptitude questions" });
  }
});

// Random
router.get("/random", async (req, res) => {
  try {
    const count = await AptitudeQuestion.countDocuments();
    const random = Math.floor(Math.random() * count);
    const question = await AptitudeQuestion.findOne().skip(random);
    res.json(question);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch random aptitude question" });
  }
});

module.exports = router;
const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();
  require('dotenv').config();
const ReasoningQuestion = require('../models/ReasoningQuestion');
mongoose.set('strictQuery', true);
mongoose.connect(process.env.DB_URI , {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err.message));


// GET /api/reasoning?topic=BloodRelations&difficulty=Easy
router.get('/', async (req, res) => {
 
  const { topic, difficulty } = req.query;
  const filter = {};
  if (topic) filter.topic = topic;


  try {
    const questions = await ReasoningQuestion.find(filter).limit(20);

    
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reasoning questions' });
  }
});

// GET /api/reasoning/random
router.get('/random', async (req, res) => {
  try {
    const count = await ReasoningQuestion.countDocuments();
    const randomIndex = Math.floor(Math.random() * count);
    const question = await ReasoningQuestion.findOne().skip(randomIndex);
    res.json(question);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch random question' });
  }
});

module.exports = router;
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const ReasoningQuestion = require('../models/ReasoningQuestion');
const { error } = require('console');

dotenv.config();

mongoose.set('strictQuery', true); // Suppress Mongoose warning
const filePath = path.join(__dirname, './reasoning.json');
console.log(filePath);
    
let questions;

try {
  if (!fs.existsSync(filePath)) {
    throw new Error('reasoning.json file does not exist');
  }
  const rawData = fs.readFileSync(filePath, 'utf-8');
  console.log('Raw data length:', rawData.length);
  console.log(rawData);
  
  if (!rawData.trim()) throw new Error('reasoning.json is empty');
  questions = JSON.parse(rawData);
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('reasoning.json does not contain any questions');
  }
  console.log(`📄 Loaded ${questions.length} questions from reasoning.json`);
} catch (err) {
  console.error(`❌ Failed to load or parse reasoning.json: ${err.message}`);
  process.exit(1);
}

mongoose.connect(process.env.DB_URI || 'mongodb://localhost:27017/studymate', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  try {
    const result = await ReasoningQuestion.insertMany(questions);
    console.log(`✅ Successfully seeded ${result.length} reasoning questions`);
  } catch (err) {
    console.error(`❌ Seeding error: ${err.message}`);
  } finally {
    mongoose.disconnect();
  }
})
.catch(err => {
  console.error(`❌ MongoDB connection error: ${err.message}`);
});
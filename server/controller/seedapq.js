const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const AptitudeQuestion = require("../models/AptitudeQ");
require('dotenv').config()


const { DB_URI, SECRET_KEY } = process.env
console.log(DB_URI);


mongoose.set("strictQuery", true);

const filePath = path.join(__dirname, "./aptitude.json");

let questions;

try {
  if (!fs.existsSync(filePath)) {
    throw new Error("aptitude.json file does not exist");
  }

  const rawData = fs.readFileSync(filePath, "utf-8");

  if (!rawData.trim()) {
    throw new Error("aptitude.json is empty");
  }

  questions = JSON.parse(rawData);

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("aptitude.json does not contain valid questions");
  }

  console.log(`📄 Loaded ${questions.length} aptitude questions`);
} catch (err) {
  console.error(`❌ Failed to load aptitude.json: ${err.message}`);
  process.exit(1);
}

mongoose.connect(process.env.DB_URI || "mongodb://127.0.0.1:27017/studymate")
  .then(async () => {
    try {

      await AptitudeQuestion.deleteMany(); // optional clear old data

      const result = await AptitudeQuestion.insertMany(questions);

      console.log(`✅ Successfully seeded ${result.length} aptitude questions`);
    } catch (err) {
      console.error(`❌ Seeding error: ${err.message}`);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch(err => {
    console.error(`❌ MongoDB connection error: ${err.message}`);
  });
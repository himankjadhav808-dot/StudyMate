const axios = require("axios");
const AptitudeQuestion = require("../models/AptitudeQ");
const ReasoningQuestion = require("../models/ReasoningQuestion");
const { QuestionSetModel } = require("../models/Question");

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

async function getFreshQuestions(Model, size) {
  const hundredDaysAgo = new Date();
  hundredDaysAgo.setDate(hundredDaysAgo.getDate() - 100);

  return await Model.aggregate([
    {
      $match: {
        $or: [
          { lastUsed: null },
          { lastUsed: { $lt: hundredDaysAgo } }
        ]
      }
    },
    { $sample: { size } }
  ]);
}

async function getLeastUsed(Model, size) {
  return await Model.find().sort({ usageCount: 1 }).limit(size);
}

async function updateUsage(Model, questions) {
  const ids = questions
    .filter((q) => q._id)
    .map((q) => q._id);

  if (ids.length > 0) {
    await Model.updateMany(
      { _id: { $in: ids } },
      {
        $set: { lastUsed: new Date() },
        $inc: { usageCount: 1 }
      }
    );
  }
}

async function generateDailyPaper() {
  console.log("⏰ Generating Daily Paper...");

  // Aptitude
  let aptitude = await getFreshQuestions(AptitudeQuestion, 15);
  if (aptitude.length < 15) {
    const backup = await getLeastUsed(AptitudeQuestion, 15 - aptitude.length);
    aptitude = [...aptitude, ...backup];
  }
  await updateUsage(AptitudeQuestion, aptitude);

  // Reasoning
  let reasoning = await getFreshQuestions(ReasoningQuestion, 20);
  if (reasoning.length < 20) {
    const backup = await getLeastUsed(ReasoningQuestion, 20 - reasoning.length);
    reasoning = [...reasoning, ...backup];
  }
  await updateUsage(ReasoningQuestion, reasoning);

  // Verbal
  const verbalRes = await axios.get(
    "https://opentdb.com/api.php?amount=15&type=multiple"
  );

  let questionCounter = 1;

  const formattedAptitude = aptitude.map((q) => ({
    questionNo: questionCounter++,
    questionBody: q.question || q.questionBody || "",
    options: Array.isArray(q.options)
      ? shuffle(q.options)
      : Object.values(q.options || {}),
    selected: "",
    answer: q.answer,
    belongsTo: q.topic || q.category || "Aptitude",
    marks: 1
  }));

  const formattedReasoning = reasoning.map((q) => ({
    questionNo: questionCounter++,
    questionBody: q.question || q.questionBody || "",
    options: Array.isArray(q.options)
      ? shuffle(q.options)
      : Object.values(q.options || {}),
    selected: "",
    answer: q.answer,
    belongsTo: q.topic || q.category || "Reasoning",
    marks: 1
  }));

  const formattedVerbal = verbalRes.data.results.map((q) => ({
    questionNo: questionCounter++,
    questionBody: q.question,
    options: shuffle([q.correct_answer, ...q.incorrect_answers]),
    selected: "",
    answer: q.correct_answer,
    belongsTo: "Verbal",
    marks: 1
  }));

  const finalQuestions = shuffle([
    ...formattedAptitude,
    ...formattedReasoning,
    ...formattedVerbal
  ]);

  await QuestionSetModel.create({
    paperCode: "DAILY-" + Date.now(),
    paperName: "Daily Mixed Paper",
    questionSet: finalQuestions,
    totalQuestions: finalQuestions.length
  });

  console.log("✅ Daily Paper Created");
}

module.exports = generateDailyPaper;
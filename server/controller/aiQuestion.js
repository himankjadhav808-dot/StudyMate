const https = require('https');
const AptitudeQuestion = require('../models/AptitudeQ');
const ReasoningQuestion = require('../models/ReasoningQuestion');

const VERBAL_TOPIC_MAP = {
  Synonyms: 10,
  Antonyms: 10,
  'Reading Comprehension': 12,
  'Sentence Correction': 23,
  'Para Jumbles': 30,
};

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 400) {
          return reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

function sanitizeText(value) {
  return typeof value === 'string'
    ? value.replace(/&quot;|&#039;|&amp;|&ldquo;|&rdquo;|&lsquo;|&rsquo;/g, (match) => {
        switch (match) {
          case '&quot;':
          case '&ldquo;':
          case '&rdquo;':
            return '"';
          case '&#039;':
          case '&lsquo;':
          case '&rsquo;':
            return "'";
          case '&amp;':
            return '&';
          default:
            return match;
        }
      })
    : value;
}

function normalizeQuestion(q, category, topic) {
  return {
    question: sanitizeText(q.question || q.prompt || ''),
    options: Array.isArray(q.options)
      ? q.options.map(sanitizeText)
      : [],
    answer: sanitizeText(q.answer || q.correct_answer || ''),
    explanation: sanitizeText(q.explanation || q.explanations || ''),
    marks: Number(q.marks) || 1,   // ← 1 mark per question by default
    belongsTo: q.belongsTo || q.category || category || 'numerical',
    category,
    topic,
  };
}

function buildOpenAIPrompt(category, topic, limit) {
  return `You are an expert exam question author. Create ${limit} original multiple choice questions in JSON format only. Do not add any commentary or text outside the JSON array.

The questions should be for the category: ${category} and topic: ${topic}.

Each item must contain:
- question: string
- options: array of 4 answer choices
- answer: one of the options exactly
- explanation: short explanation of the correct answer

Use proper punctuation, and ensure every returned object has a valid answer from its options array.`;
}

async function callOpenAI(category, topic, limit) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured');
  }

  const body = JSON.stringify({
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    max_tokens: 1200,
    messages: [
      {
        role: 'system',
        content: 'You are a helpful exam question generator.',
      },
      {
        role: 'user',
        content: buildOpenAIPrompt(category, topic, limit),
      },
    ],
  });

  const options = {
    method: 'POST',
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(body),
    },
  };

  const response = await makeRequest(options, body);
  const content = response?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  const json = JSON.parse(content.trim());
  if (!Array.isArray(json)) {
    throw new Error('Invalid JSON from OpenAI');
  }

  return json.map((item) => normalizeQuestion(item, category, topic)).filter((item) => item.question && item.options.length >= 2 && item.answer);
}

async function fetchOpenTrivia(category, topic, limit) {
  const categoryId = VERBAL_TOPIC_MAP[topic] || 10;
  const url = `https://opentdb.com/api.php?amount=${limit}&category=${categoryId}&difficulty=medium&type=multiple`;
  const options = {
    method: 'GET',
    hostname: 'opentdb.com',
    path: `/api.php?amount=${limit}&category=${categoryId}&difficulty=medium&type=multiple`,
  };
  const result = await makeRequest(options);
  if (!result || !Array.isArray(result.results)) {
    throw new Error('Open Trivia DB returned invalid data');
  }

  return result.results.map((q) => normalizeQuestion({
    question: q.question,
    options: [q.correct_answer, ...q.incorrect_answers],
    answer: q.correct_answer,
    explanation: 'Explanation not provided by Open Trivia DB.',
  }, category, topic));
}

async function randomAptitudeQuestions(topic, limit) {
  const match = topic ? { category: topic } : {};
  const fallback = await AptitudeQuestion.aggregate([
    { $match: match },
    { $sample: { size: Math.min(limit, 50) } },
  ]);

  if (fallback.length === 0 && topic) {
    return randomAptitudeQuestions(null, limit);
  }

  return fallback.map((q) => normalizeQuestion(q, 'Aptitude', topic));
}

async function randomReasoningQuestions(topic, limit) {
  const match = topic ? { topic } : {};
  const fallback = await ReasoningQuestion.aggregate([
    { $match: match },
    { $sample: { size: Math.min(limit, 50) } },
  ]);

  if (fallback.length === 0 && topic) {
    return randomReasoningQuestions(null, limit);
  }

  return fallback.map((q) => normalizeQuestion(q, 'Reasoning', topic));
}

function getCategoryTopicFromLevel(level) {
  const normalized = String(level || '').toLowerCase();
  switch (normalized) {
    case 'beginner':
      return {
        category: 'Standard',
        topic: 'Beginner aptitude questions for freshers',
      };
    case 'medium':
      return {
        category: 'Standard',
        topic: 'Medium aptitude questions for regulars',
      };
    case 'pro':
    case 'difficult':
      return {
        category: 'Standard',
        topic: 'Pro aptitude questions for interviews',
      };
    default:
      return {
        category: 'Standard',
        topic: 'General aptitude questions for learners',
      };
  }
}

function buildStaticStandardQuestions(level, limit) {
  const normalized = String(level || 'beginner').toLowerCase();
  const questionBanks = {
    beginner: [
      {
        question: 'If a student scores 40 out of 50, what percentage did they obtain?',
        options: ['70%', '75%', '80%', '85%'],
        answer: '80%',
        explanation: 'Percentage = (40/50)*100 = 80%.',
      },
      {
        question: 'A shopkeeper sells an item for $120 after a 20% discount. What was the original price?',
        options: ['$140', '$145', '$150', '$160'],
        answer: '$150',
        explanation: 'Original price = 120 / 0.8 = $150.',
      },
      {
        question: 'What is 25% of 240?',
        options: ['50', '55', '60', '65'],
        answer: '60',
        explanation: '25% of 240 is 240 * 0.25 = 60.',
      },
    ],
    medium: [
      {
        question: 'A contractor completes 40% of a job in 8 days. How many more days are needed to finish the remaining work at the same rate?',
        options: ['10', '12', '14', '16'],
        answer: '12',
        explanation: '40% takes 8 days, so 100% takes 20 days. Remaining 60% takes 12 days.',
      },
      {
        question: 'The ratio of boys to girls in a class is 3:4. If there are 21 boys, how many girls are there?',
        options: ['24', '25', '28', '30'],
        answer: '28',
        explanation: '3x = 21 so x = 7, girls = 4x = 28.',
      },
      {
        question: 'A sum of money doubles itself in 5 years at simple interest. What is the annual interest rate?',
        options: ['10%', '12%', '15%', '20%'],
        answer: '20%',
        explanation: 'Simple interest for 5 years equals 100% of principal, so rate = 100/5 = 20%.',
      },
    ],
    pro: [
      {
        question: 'A machine can complete a task in 12 hours and another can complete the same task in 18 hours. Working together, how long will they take?',
        options: ['7h 12m', '7h 30m', '8h', '8h 30m'],
        answer: '7h 12m',
        explanation: 'Combined rate = 1/12 + 1/18 = 5/36, time = 36/5 = 7.2 hours = 7h 12m.',
      },
      {
        question: 'If 5 workers can build a wall in 9 days, how many workers are needed to build it in 6 days at the same rate?',
        options: ['6', '7', '8', '10'],
        answer: '8',
        explanation: 'Work is inversely proportional to workers: 5*9 = x*6 so x=7.5, nearest whole worker is 8.',
      },
      {
        question: 'A bag contains red, blue, and green balls in the ratio 2:3:5. If there are 50 balls, how many are blue?',
        options: ['15', '18', '20', '25'],
        answer: '15',
        explanation: 'Total parts = 10, blue part = 3 so 50*(3/10)=15.',
      },
    ],
  };

  const bank = questionBanks[normalized] || questionBanks.beginner;
  return bank.slice(0, limit).map((q) => normalizeQuestion(q, 'Standard', `${normalized} level`));
}

async function getFallbackQuestions(category, topic, limit, level) {
  if (category === 'Aptitude') {
    return randomAptitudeQuestions(topic, limit);
  }
  if (category === 'Reasoning') {
    return randomReasoningQuestions(topic, limit);
  }
  if (category === 'Verbal Ability') {
    return fetchOpenTrivia(category, topic, limit);
  }
  if (category === 'Standard') {
    const aptitudeCount = Math.ceil(limit / 2);
    const reasoningCount = Math.floor(limit / 2);
    const aptitudeQuestions = await randomAptitudeQuestions(null, aptitudeCount);
    const reasoningQuestions = await randomReasoningQuestions(null, reasoningCount);
    const combined = [...aptitudeQuestions, ...reasoningQuestions].slice(0, limit);
    if (combined.length > 0) {
      return combined;
    }
    return buildStaticStandardQuestions(level, limit);
  }

  return [];
}

async function generateAIQuestions(req, res) {
  const level = req.query.level || req.body.level;
  let category = req.query.category || req.body.category;
  let topic = req.query.topic || req.body.topic;
  const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 10, 50));

  if ((!category || !topic) && level) {
    const mapped = getCategoryTopicFromLevel(level);
    category = mapped.category;
    topic = mapped.topic;
  }

  if (!category || !topic) {
    return res.status(400).json({ error: 'category and topic are required' });
  }

  try {
    if (process.env.OPENAI_API_KEY) {
      const aiQuestions = await callOpenAI(category, topic, limit);
      if (aiQuestions.length > 0) {
        return res.json(aiQuestions);
      }
    }
  } catch (openAIError) {
    console.warn('OpenAI generation failed, falling back to dynamic questions:', openAIError.message);
  }

  try {
    const fallback = await getFallbackQuestions(category, topic, limit, level);
    if (!fallback || fallback.length === 0) {
      return res.status(500).json({ error: 'Could not generate practice questions' });
    }
    return res.json(fallback);
  } catch (fallbackError) {
    console.error('AI fallback error:', fallbackError);
    return res.status(500).json({ error: 'Failed to load practice questions' });
  }
}

module.exports = { generateAIQuestions };

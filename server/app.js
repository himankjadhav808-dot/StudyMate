const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
require('dotenv').config(); 

// Allow any localhost port (Vite can start on 5173, 5174, etc.) + production
const corsOptions = {
  origin: (origin, callback) => {
    const allowedPatterns = [
      /^http:\/\/localhost:\d+$/,          // any localhost port
      /^https:\/\/study-mate-self\.vercel\.app$/,
    ];
    if (!origin || allowedPatterns.some((p) => p.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const cron = require('node-cron');
const generatePaper = require('./controller/seedaplitude');
const { generateAIQuestions } = require('./controller/aiQuestion');

const LearnerRouter = require('./routes/LearnerRouter');
const examRouter = require('./routes/examRouter');
const reasoningRoutes = require('./routes/reasoning');
const AptitudeRoutes = require('./routes/Aptitude');
const questionSetRoutes = require('./routes/testform');
const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiQuestions');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

// CRON
cron.schedule('30 13 * * *', async () => {
  await generatePaper();
});

mongoose.connect(process.env.DB_URI)
  .then(() => {
    console.log("✅ Mongo Connected");

    app.use('/', LearnerRouter);
    app.use('/exam', examRouter);
    app.use('/api/auth', authRoutes);
    app.use('/api/aptitude', AptitudeRoutes);
    app.use('/api/reasoning', reasoningRoutes);
    app.get('/api/ai', generateAIQuestions);
    app.use('/api/questionset', questionSetRoutes);
    app.use('/api/ai', aiRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/admin', adminRoutes);

    const PORT = process.env.PORT || 3300;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on PORT ${PORT}`);
    });

  })
  .catch(err => {
    console.error("❌ DB Error:", err);
    process.exit(1);
  });
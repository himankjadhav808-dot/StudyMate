const express = require('express');
const router = express.Router();
const { generateAIQuestions } = require('../controller/aiQuestion');

router.get('/', generateAIQuestions);

module.exports = router;

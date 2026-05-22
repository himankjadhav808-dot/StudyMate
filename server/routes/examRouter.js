const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
require('dotenv').config()
const { SECRET_KEY } = process.env
const Learner = require('../models/Learner')

const {getQuestions} = require('../controller/exam')
const {evaluate} = require('../controller/evaluate')

router.post('/qes', getQuestions)
router.post('/eval', evaluate)

// GET /exam/results  — returns all saved results for the logged-in user
router.get('/results', async (req, res) => {
    try {
        const cookieToken = req.cookies?.token;
        const bearerToken = req.headers.authorization?.split(' ')[1];
        const token = cookieToken || bearerToken;
        if (!token) return res.status(401).json({ success: false, message: 'Not authenticated' })

        const decoded = jwt.verify(token, SECRET_KEY)
        const learner = await Learner.findById(decoded.id).select('results')

        if (!learner) return res.status(404).json({ success: false, message: 'User not found' })

        // Return results newest-first
        const results = [...(learner.results || [])].reverse()
        return res.json({ success: true, results })

    } catch (err) {
        console.error('GET /exam/results error:', err.message)
        return res.status(500).json({ success: false, message: 'Server error' })
    }
})

module.exports = router

const jwt = require('jsonwebtoken');
const Learner = require('../models/Learner');
require('dotenv').config();

const { SECRET_KEY } = process.env;

const normalizeCategory = (belongsTo) => {
    const category = String(belongsTo || '').trim().toLowerCase();

    if (!category) return 'numerical';

    if (
        ['verbal', 'grammar', 'vocab', 'english', 'reading', 'comprehension', 'sentence']
            .some((keyword) => category.includes(keyword))
    ) {
        return 'varbal';
    }

    if (
        ['reason', 'logic', 'analogy', 'puzzle', 'coding', 'deduction', 'series', 'sequence']
            .some((keyword) => category.includes(keyword))
    ) {
        return 'reasoning';
    }

    if (['general', 'gk', 'general knowledge'].some((keyword) => category.includes(keyword))) {
        return 'genaral';
    }

    return 'numerical';
};

const evaluate = async (req, res) => {
    const { questionSet, paperName, level, paperCode } = req.body;

    const maxMarks = Array.isArray(questionSet)
        ? questionSet.reduce((sum, q) => {
            const pts = (typeof q.marks === 'number' && q.marks > 0) ? q.marks : 1;
            return sum + pts;
        }, 0)
        : 0;

    const report = {
        paperName,
        paperCode,
        level,
        totalQuestions: Array.isArray(questionSet) ? questionSet.length : 0,
        maxMarks,
        marks: 0,
        correct: 0,
        wrong: 0,
        attempt: 0,
        unattempt: 0,
        numerical: 0,
        varbal: 0,
        reasoning: 0,
        genaral: 0,
        grade: null,
        takenAt: new Date(),
    };

    questionSet.map(({ selected, answer, options, marks, belongsTo }) => {
        const pts = (typeof marks === 'number' && marks > 0) ? marks : 1;
        const sel = String(selected ?? '').trim();

        // Resolve answer: if stored as a letter (A/B/C/D), map it to actual option text
        const letterMap = { A: 0, B: 1, C: 2, D: 3 };
        let resolvedAnswer = String(answer ?? '').trim();
        const upperAnswer = resolvedAnswer.toUpperCase();
        if (letterMap[upperAnswer] !== undefined && Array.isArray(options) && options[letterMap[upperAnswer]] !== undefined) {
            resolvedAnswer = String(options[letterMap[upperAnswer]]).trim();
        }

        console.log(`[eval] selected="${sel}" | answer="${resolvedAnswer}" | match=${sel === resolvedAnswer}`);

        if (sel !== '' && sel === resolvedAnswer) {
            report.marks += pts;
            report.correct += 1;
            report.attempt += 1;

            const key = normalizeCategory(belongsTo || '');
            report[key] += pts;
        } else if (sel !== '') {
            report.attempt += 1;
            report.wrong += 1;
        } else {
            report.unattempt += 1;
        }
    });

    const percentage = maxMarks > 0 ? (report.marks / maxMarks) * 100 : 0;
    if (percentage >= 80)
        report.grade = 'A';
    else if (percentage >= 60)
        report.grade = 'B';
    else if (percentage >= 40)
        report.grade = 'C';
    else
        report.grade = 'Bad';

    // ── Save result to DB if user is logged in ────────────────────────────────
    try {
        const cookieToken = req.cookies?.token;
        const bearerToken = req.headers.authorization?.split(' ')[1];
        const token = cookieToken || bearerToken;
        if (token && SECRET_KEY) {
            const decoded = jwt.verify(token, SECRET_KEY);
            if (decoded?.id) {
                await Learner.findByIdAndUpdate(
                    decoded.id,
                    { $push: { results: report } }
                );
                console.log(`✅ Result saved for user: ${decoded.email}`);
            }
        }
    } catch (err) {
        // Non-critical — don't block the response
        console.error('Could not save result to DB:', err.message);
    }

    res.json({ success: true, report });
};

module.exports = { evaluate };
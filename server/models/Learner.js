const mongoose = require('mongoose')
const {Schema} = mongoose

const resultSchema = new Schema({
    paperName: String,
    paperCode: String,
    level: String,
    totalQuestions: Number,
    maxMarks: Number,
    marks: Number,
    correct: Number,
    wrong: Number,
    attempt: Number,
    unattempt: Number,
    numerical: Number,
    varbal: Number,
    reasoning: Number,
    genaral: Number,
    grade: String,
    takenAt: { type: Date, default: Date.now },
}, { _id: false })

const learnerShema = new Schema({
    fname: String,
    lname: String,
    email: String,
    password: String,
    verified: Boolean,
    blocked: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin', 'admin_pending'], default: 'user' },
    createdAt: Date,
    results: [resultSchema],
    joinedExamCodes: {
        type: [String],
        default: []
    }
},
{
    versionKey: false
}
)

module.exports = mongoose.model('Learner', learnerShema)
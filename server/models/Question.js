const mongoose = require('mongoose')

const {Schema, model} = mongoose

const QuestionSetSchema = Schema({
    paperCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
        // Not unique — multiple sessions can share the same paper code
    },
    paperName: {
        type: String,
        required: true,
        trim: true
    },
    questionSet: [{
        _id: false,
        questionNo: Number,
        questionBody: String,
        options: Object,
        selected: {
            type: String,
            default: ''
        },
        answer: String,
        belongsTo: String,
        marks: Number
    }],
    level: String,
    timeLimit: {
        type: Number,
        default: 1500,
        min: 1
    },
    totalQuestions: Number,
    sessionCode: {
        type: String,
        unique: true,
        required: true,
        length: 6 // Ensure 6-character alphanumeric code
    },
    teacherId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User' // Assuming a User model for teachers
    }
}, { timestamps: true })

const QuestionSetModel = model('questionset', QuestionSetSchema)

module.exports = {QuestionSetModel}
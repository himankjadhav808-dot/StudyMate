const mongoose = require('mongoose');
const { Schema } = mongoose;

const contactMessageSchema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'Learner', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['new', 'reviewed', 'resolved'], default: 'new' },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);

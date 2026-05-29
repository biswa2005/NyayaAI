const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming you have a User model for authentication
    required: true
  },
  caseTitle: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  hearingDate: {
    type: Date,
    required: true
  },
  isNotified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Reminder', ReminderSchema);
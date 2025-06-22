const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: { type: String, required: true },            // e.g., email or unique user ID
  problemTitle: { type: String, required: true },      // links to Problem title
  isSolved: { type: Boolean, default: false },
  revisionCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('Progress', progressSchema);

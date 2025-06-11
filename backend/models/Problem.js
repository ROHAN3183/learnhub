const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  title: String,
  company: String,
  topics: [String],
  difficulty: String
});

module.exports = mongoose.model('Problem', problemSchema);

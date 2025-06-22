const express = require('express');
const router = express.Router();
const Problem = require('../models/Problem');

// ✅ Bulk Add Problems
router.post('/add-multiple', async (req, res) => {
  try {
    const problems = req.body;

    if (!Array.isArray(problems) || problems.length === 0) {
      return res.status(400).json({ msg: 'Invalid data format. Expected an array of problems.' });
    }

    await Problem.insertMany(problems);
    res.status(201).json({ msg: 'Problems added successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ✅ Get All Problems (Supports search by title)
router.get('/', async (req, res) => {
  try {
    const { title } = req.query;

    const filter = {};

    if (title) {
      filter.title = { $regex: title, $options: 'i' }; // case-insensitive search
    }

    const problems = await Problem.find(filter);
    res.json(problems);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ✅ Advanced Filtering: company, difficulty, topics, pagination, sorting
router.get('/filter', async (req, res) => {
  try {
    const {
      title,
      company,
      topics,
      difficulty,
      page = 1,
      limit = 20,
      sortBy = 'title',
      order = 'asc'
    } = req.query;

    const filter = {};

    if (title) {
      filter.title = { $regex: title, $options: 'i' };
    }

    if (company) {
      filter.company = company;
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (topics) {
      const topicsArray = Array.isArray(topics) ? topics : topics.split(',');
      filter.topics = { $all: topicsArray };
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const problems = await Problem.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    res.json(problems);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;

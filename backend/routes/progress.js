const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');

// ✅ Get progress for a specific user
router.get('/:userId', async (req, res) => {
  try {
    const userProgress = await Progress.find({ userId: req.params.userId });
    res.json(userProgress);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ✅ Update or insert progress for a problem for a user
router.post('/update', async (req, res) => {
  const { userId, problemTitle, isSolved, revisionCount } = req.body;

  try {
    const updated = await Progress.findOneAndUpdate(
      { userId, problemTitle },
      { isSolved, revisionCount },
      { upsert: true, new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: 'Update failed', error: err.message });
  }
});

module.exports = router;

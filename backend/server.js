require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000; // Default to 5000 if not in .env

// Middleware
app.use(cors({
  origin: '*' // For testing: allow all origins
  // Later, replace '*' with your CloudFront domain for production:
  // origin: 'https://d123abc.cloudfront.net'
}));
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const problemsRoutes = require('./routes/problems');
app.use('/api/problems', problemsRoutes);

const progressRoutes = require('./routes/progress');
app.use('/api/progress', progressRoutes);

// Root Route
app.get('/', (req, res) => {
  res.send('DSA LearnHub Backend is Running');
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('MongoDB connected');
    // Listen on all network interfaces so backend is accessible externally
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error('MongoDB connection error:', err));

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import jobRoutes from './routes/jobRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';

import User from './models/User.js';
import { auth } from './middleware/auth.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded body (optional)

// Optional: attach userDoc if token present (handy for role checks)
app.use(auth(false), async (req, _res, next) => {
    console.log(`📥 ${req.method} ${req.originalUrl}`);

  try {
    if (req.user?.id) {
      req.userDoc = await User.findById(req.user.id).select('roles account personal').lean();
    } else {
      req.userDoc = null;
    }
  } catch (e) {
    req.userDoc = null;
  }
  next();
});

// Routes
app.use('/api/jobs', jobRoutes);
app.use('/api/users', userRoutes); // /me and /:id
app.use('/api/auth', authRoutes); // register, login

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));

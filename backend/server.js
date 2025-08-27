// backend/server.js
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import jobRoutes from './routes/jobRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import spotifyRoutes from './routes/spotifyRoutes.js';

import User from './models/User.js';
import { auth } from './middleware/auth.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// app.use(cors());
// If you're behind Cloudflare/NGINX, this helps cookies/session libs know it's HTTPS:
app.set('trust proxy', 1); // so req.secure works behind Cloudflare/NGINX if you use it
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // http://localhost:3000
    credentials: true,                // allow cookies
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded body (optional)
app.use(cookieParser());

// Optional: attach userDoc if token present (handy for role checks)
app.use(auth(false), async (req, _res, next) => {
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
app.use('/api/spotify', spotifyRoutes); // Spotify auth and token management

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));

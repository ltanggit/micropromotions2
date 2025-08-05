// backend/routes/userRoutes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const router = express.Router();

/** Create a new user (signup) */
router.post('/register', async (req, res) => {
  try {
    const { email, password, roles = [], payer, worker } = req.body;

    // Check for existing user
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already in use' });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create({
      email,
      passwordHash,
      roles,
      ...(payer && { payer }),
      ...(worker && { worker }),
    });

    res.status(201).json({
      _id: user._id,
      email: user.email,
      roles: user.roles,
      createdAt: user.createdAt,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

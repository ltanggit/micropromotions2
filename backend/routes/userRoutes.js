// backend/routes/userRoutes.js
import express from 'express';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

/** GET /api/users/me */
router.get('/me', auth(true), async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

/** PATCH /api/users/me — Update logged-in user's info */
router.patch('/me', auth(true), async (req, res) => {
  const allowed = [
    'account.username', 'personal.name', 'personal.bio',
    'preferences.likes', 'preferences.dislikes',
    'socials.website', 'socials.instagram'
    // Add more fields as needed
  ];

  const updates = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  for (const key in updates) {
    if (!allowed.includes(key)) continue;
    const [section, field] = key.split('.');
    user[section][field] = updates[key];
  }

  await user.save();
  res.json({ success: true, user });
});

/** GET /api/users/:id — Get any user's public profile */
router.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id).select('account.username personal.bio socials');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

export default router;
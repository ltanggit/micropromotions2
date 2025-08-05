// backend/routes/authRoutes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/** POST /api/auth/register */
router.post('/register', async (req, res) => {
  try {
    const {
      email, password, roles = [],
      payer, worker,
      username, status, subscription, isValid, isActive,
      region, language, affiliateId, groups, campaigns, isEnrolled, isMarketable,
      name, age, bio,
      website, spotify, instagram, twitter, tiktok, youtube,
      likes, dislikes,
      paypalEmail, stripeConnectId, preferredMethod
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    console.log('Received email:', email); // <-- add this


    const exists = await User.findOne({ 'personal.email': email });
    if (exists) return res.status(400).json({ error: 'Email already in use' });

    if (username) {
      const uname = await User.findOne({ 'account.username': username.toLowerCase() });
      if (uname) return res.status(400).json({ error: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      passwordHash,
      roles,
      payer,
      worker,
      account: {
        username,
        status: status ?? 'active',
        subscription: subscription ?? 'free',
        isValid: !!isValid,
        isActive: isActive ?? true,
        region, language, affiliateId, groups, campaigns,
        isEnrolled: !!isEnrolled,
        isMarketable: !!isMarketable,
      },
      personal: { email, name, age, bio },
      socials: { website, spotify, instagram, twitter, tiktok, youtube },
      preferences: { likes, dislikes },
      payment: { paypalEmail, stripeConnectId, preferredMethod },
    });

    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.personal.email,
        roles: user.roles,
        username: user.account?.username,
        subscription: user.account?.subscription,
        createdAt: user.createdAt
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

/** POST /api/auth/login */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ 'personal.email': email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // Update last active
    user.account = user.account || {};
    user.account.lastActiveAt = new Date();
    await user.save();

    const token = signToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        email: user.personal.email,
        roles: user.roles,
        username: user.account?.username,
        subscription: user.account?.subscription
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

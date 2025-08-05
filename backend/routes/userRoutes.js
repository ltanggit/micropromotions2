// backend/routes/userRoutes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      roles = [],
      payer,
      worker,

      // Account fields
      username,
      status,
      subscription,
      isValid,
      isActive,
      region,
      language,
      affiliateId,
      groups,
      campaigns,
      isEnrolled,
      isMarketable,

      // Personal
      name,
      age,
      bio,

      // Socials
      website,
      spotify,
      instagram,
      twitter,
      tiktok,
      youtube,

      // Preferences
      likes,
      dislikes,

      // Payment (optional)
      paypalEmail,
      stripeConnectId,
      preferredMethod,
    } = req.body;

    // Check email uniqueness
    const exists = await User.findOne({ 'personal.email': email });
    if (exists) return res.status(400).json({ error: 'Email already in use' });

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
        region,
        language,
        affiliateId,
        groups,
        campaigns,
        isEnrolled: !!isEnrolled,
        isMarketable: !!isMarketable,
        // lastActiveAt / verifiedAt are set elsewhere (login/verify flows)
      },

      personal: {
        email,
        name,
        age,
        bio,
      },

      socials: { website, spotify, instagram, twitter, tiktok, youtube },
      preferences: { likes, dislikes },
      payment: { paypalEmail, stripeConnectId, preferredMethod },
    });

    res.status(201).json({
      id: user._id,
      email: user.personal.email,
      roles: user.roles,
      subscription: user.account?.subscription ?? 'free',
      createdAt: user.createdAt,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
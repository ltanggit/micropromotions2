// backend/middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * auth(required = true)
 * - If required=true: reject requests without a valid token.
 * - If required=false: allow requests and set req.user = null when no/invalid token.
 */
export function auth(required = true) {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;

      if (!token) {
        if (required) return res.status(401).json({ error: 'Missing token' });
        req.user = null;
        req.userDoc = null;
        return next();
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: payload.sub };

      // 🔑 Load the user document
      const userDoc = await User.findById(payload.sub).lean();
      if (!userDoc) {
        if (required) return res.status(401).json({ error: 'User not found' });
        req.user = null;
        req.userDoc = null;
        return next();
      }
      req.userDoc = userDoc;

      next();
    } catch (err) {
      if (required) return res.status(401).json({ error: 'Invalid or expired token' });
      req.user = null;
      req.userDoc = null;
      next();
    }
  };
}

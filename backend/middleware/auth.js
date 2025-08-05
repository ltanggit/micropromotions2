// backend/middleware/auth.js
import jwt from 'jsonwebtoken';

/**
 * auth(required = true)
 * - If required=true: reject requests without a valid token.
 * - If required=false: allow requests and set req.user = null when no/invalid token.
 */
export function auth(required = true) {
  return (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;

      if (!token) {
        if (required) return res.status(401).json({ error: 'Missing token' });
        req.user = null;
        return next();
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: payload.sub };
      next();
    } catch (err) {
      if (required) return res.status(401).json({ error: 'Invalid or expired token' });
      req.user = null;
      next();
    }
  };
}

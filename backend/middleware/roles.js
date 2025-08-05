// Simple role guard
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!req.userDoc?.roles?.includes(role)) {
      return res.status(403).json({ error: `Requires role: ${role}` });
    }
    next();
  };
}

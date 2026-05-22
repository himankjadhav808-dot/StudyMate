const jwt = require('jsonwebtoken');

// ── Verify JWT and attach user to req ────────────────────────────────────────
const verifyJWT = (req, res, next) => {
  const cookieToken = req.cookies.token;
  const bearerToken = req.headers.authorization?.split(' ')[1];
  const token = cookieToken || bearerToken;

  console.log(`[verifyJWT] ${req.method} ${req.path} | cookie=${!!cookieToken} bearer=${!!bearerToken}`);

  if (!token) return res.status(401).json({ success: false, message: 'No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    console.log(`[verifyJWT] ✅ Valid token for user: ${decoded.email}`);
    next();
  } catch (err) {
    console.log(`[verifyJWT] ❌ Invalid token: ${err.message}`);
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// ── Verify user role ─────────────────────────────────────────────────────────
const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated.' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Access denied. Required roles: ${allowedRoles.join(', ')}` });
    }
    next();
  };
};

// ── Shorthand: Admin only ────────────────────────────────────────────────────
const isAdmin = verifyRole(['admin']);

// ── Shorthand: Super admin only (currently using admin, can extend later) ─────
const isSuperAdmin = verifyRole(['admin']);

module.exports = { verifyJWT, verifyRole, isAdmin, isSuperAdmin };

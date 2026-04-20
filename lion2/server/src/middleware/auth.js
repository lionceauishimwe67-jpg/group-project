const jwt = require('jsonwebtoken');

function auth(required = true) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      if (!required) return next();
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
      req.user = { id: decoded.id };
      next();
    } catch (err) {
      if (!required) return next();
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
}

module.exports = auth;


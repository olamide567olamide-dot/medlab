function verifyApiKey(req, res, next) {
  const expectedKey = process.env.BACKEND_API_KEY;
  if (!expectedKey) return next();

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.headers['x-api-key'];
  if (!token || token !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

module.exports = { verifyApiKey };

const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60, useClones: false });

function getCache(key) {
  return cache.get(key);
}

function setCache(key, value, ttl = 300) {
  cache.set(key, value, ttl);
}

function cacheMiddleware(req, res, next) {
  const cacheKey = `${req.method}:${req.originalUrl}:${JSON.stringify(req.body || {})}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return res.json(cached);
  }
  res.sendJson = res.json;
  res.json = function (body) {
    setCache(cacheKey, body);
    return res.sendJson(body);
  };
  next();
}

module.exports = { getCache, setCache, cacheMiddleware };

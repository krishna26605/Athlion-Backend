const NodeCache = require('node-cache');

// TTL of 5 minutes. In serverless, this cache is per-Lambda instance
// (not shared across concurrent instances). See DEPLOYMENT.md for Redis migration path.
const eventsCache = new NodeCache({ stdTTL: 300 });

module.exports = eventsCache;

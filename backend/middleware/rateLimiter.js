const rateLimit = require('express-rate-limit');

const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please wait 15 minutes.',
        retryAfter: '15 minutes'
    },
    skip: (req) => req.path === '/health' || req.path === '/'
});

module.exports = { rateLimiter };
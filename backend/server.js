require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Health Check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'BharatAgent API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Routes - loaded after middleware
const agentRoutes = require('./routes/agent');
const voiceRoutes = require('./routes/voice');
const memoryRoutes = require('./routes/memory');

app.use('/api/agent', agentRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/memory', memoryRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
    });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
    console.log(`✅ BharatAgent backend running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`📡 Routes: /api/agent, /api/voice, /api/memory`);
});

module.exports = app;
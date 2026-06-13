const express = require('express');
const router = express.Router();
const { getUserHistory, getRelatedTasks } = require('../services/neo4jService');

// Get user history from Neo4j graph
router.get('/history/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 20;

        if (!userId || userId.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'userId is required'
            });
        }

        if (limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                error: 'Limit must be between 1 and 100'
            });
        }

        const history = await getUserHistory(userId, limit);

        res.json({
            success: true,
            userId,
            count: history.length,
            history
        });
    } catch (err) {
        next(err);
    }
});

// Get related tasks from graph
router.get('/related', async (req, res, next) => {
    try {
        const { agentType, language } = req.query;

        if (!agentType || !language) {
            return res.status(400).json({
                success: false,
                error: 'agentType and language are required'
            });
        }

        const related = await getRelatedTasks(agentType, language);

        res.json({
            success: true,
            agentType,
            language,
            relatedTasks: related
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
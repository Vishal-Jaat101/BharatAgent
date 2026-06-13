const express = require('express');
const router = express.Router();
const { processAgentTask, SUPPORTED_LANGUAGES } = require('../services/agentService');
const { createWorkflowJob, getJobStatus, getUserJobs } = require('../services/renderWorkflow');

// Get all supported languages
router.get('/languages', (req, res) => {
    res.json({
        success: true,
        languages: SUPPORTED_LANGUAGES
    });
});

// Process a task
router.post('/task', async (req, res, next) => {
    try {
        const { task, language, userId } = req.body;
        if (!task || task.trim() === '') {
            return res.status(400).json({ success: false, error: 'Task is required' });
        }
        if (!userId || userId.trim() === '') {
            return res.status(400).json({ success: false, error: 'userId is required' });
        }
        const lang = language || 'en-IN';
        if (!SUPPORTED_LANGUAGES[lang]) {
            return res.status(400).json({ success: false, error: 'Language not supported' });
        }
        const result = await processAgentTask(task, lang, userId);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

// Create background workflow job
router.post('/workflow', async (req, res, next) => {
    try {
        const { userId, task, language, agentType, scheduledAt } = req.body;
        if (!userId || !task) {
            return res.status(400).json({ success: false, error: 'userId and task are required' });
        }
        const result = await createWorkflowJob({
            userId,
            task,
            language: language || 'en-IN',
            agentType: agentType || 'general',
            scheduledAt
        });
        res.json(result);
    } catch (err) {
        next(err);
    }
});

// Get all jobs for a user — MUST be before /workflow/:jobId
router.get('/workflow/user/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const result = await getUserJobs(userId);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

// Get workflow job status
router.get('/workflow/:jobId', async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const result = await getJobStatus(jobId);
        if (!result.success) {
            return res.status(404).json(result);
        }
        res.json(result);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
const axios = require('axios');

const RENDER_API_KEY = process.env.RENDER_API_KEY;

const renderClient = axios.create({
    baseURL: 'https://api.render.com/v1',
    timeout: 30000,
    headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Content-Type': 'application/json'
    }
});

// In-memory job store (replaced by Neo4j in production)
const jobStore = new Map();

// Create a background workflow job
const createWorkflowJob = async (jobData) => {
    try {
        const { userId, task, language, agentType, scheduledAt } = jobData;

        const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const job = {
            id: jobId,
            userId,
            task,
            language,
            agentType,
            scheduledAt: scheduledAt || new Date().toISOString(),
            status: 'pending',
            createdAt: new Date().toISOString(),
            retries: 0,
            maxRetries: 3
        };

        // Store job locally
        jobStore.set(jobId, job);

        // Simulate workflow execution
        setTimeout(() => executeJob(jobId), 2000);

        console.log(`✅ Workflow job created: ${jobId}`);

        return {
            success: true,
            jobId,
            status: 'pending',
            message: `Background job created for task: "${task}"`
        };
    } catch (err) {
        console.error('Render workflow error:', err.message);
        return {
            success: false,
            error: err.message
        };
    }
};

// Execute a job
const executeJob = async (jobId) => {
    const job = jobStore.get(jobId);
    if (!job) return;

    try {
        job.status = 'running';
        job.startedAt = new Date().toISOString();
        jobStore.set(jobId, job);

        console.log(`🔄 Executing job: ${jobId} - Task: ${job.task}`);

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1500));

        job.status = 'completed';
        job.completedAt = new Date().toISOString();
        job.result = `Task "${job.task}" completed successfully via BharatAgent workflow.`;
        jobStore.set(jobId, job);

        console.log(`✅ Job completed: ${jobId}`);
    } catch (err) {
        job.status = 'failed';
        job.error = err.message;
        job.retries += 1;
        jobStore.set(jobId, job);

        // Retry logic
        if (job.retries < job.maxRetries) {
            console.log(`🔁 Retrying job ${jobId} (attempt ${job.retries})`);
            setTimeout(() => executeJob(jobId), 3000 * job.retries);
        } else {
            console.error(`❌ Job ${jobId} failed after ${job.maxRetries} retries`);
        }
    }
};

// Get job status
const getJobStatus = async (jobId) => {
    try {
        const job = jobStore.get(jobId);

        if (!job) {
            return {
                success: false,
                error: 'Job not found'
            };
        }

        return {
            success: true,
            job: {
                id: job.id,
                status: job.status,
                task: job.task,
                language: job.language,
                agentType: job.agentType,
                createdAt: job.createdAt,
                completedAt: job.completedAt || null,
                result: job.result || null,
                error: job.error || null,
                retries: job.retries
            }
        };
    } catch (err) {
        console.error('Get job status error:', err.message);
        return {
            success: false,
            error: err.message
        };
    }
};

// Get all jobs for a user
const getUserJobs = async (userId) => {
    try {
        const userJobs = [];
        for (const [, job] of jobStore) {
            if (job.userId === userId) {
                userJobs.push({
                    id: job.id,
                    status: job.status,
                    task: job.task,
                    agentType: job.agentType,
                    createdAt: job.createdAt,
                    completedAt: job.completedAt || null
                });
            }
        }
        return {
            success: true,
            jobs: userJobs.sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            )
        };
    } catch (err) {
        console.error('Get user jobs error:', err.message);
        return {
            success: false,
            jobs: [],
            error: err.message
        };
    }
};

module.exports = {
    createWorkflowJob,
    getJobStatus,
    getUserJobs
};
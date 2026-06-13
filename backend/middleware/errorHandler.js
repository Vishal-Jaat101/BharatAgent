const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${err.message}`);

    if (err.isAxiosError) {
        const status = err.response?.status || 503;
        return res.status(status).json({
            error: 'External API error',
            message: err.response?.data?.message || 'AI service temporarily unavailable'
        });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation failed',
            message: err.message
        });
    }

    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
};

module.exports = { errorHandler };
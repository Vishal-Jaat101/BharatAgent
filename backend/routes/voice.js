const express = require('express');
const router = express.Router();
const { textToSpeech, speechToText, detectLanguage } = require('../services/sarvamService');

// Text to Speech
router.post('/tts', async (req, res, next) => {
    try {
        const { text, language } = req.body;

        if (!text || text.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Text is required'
            });
        }

        const lang = language || 'hi-IN';
        const result = await textToSpeech(text, lang);

        res.json(result);
    } catch (err) {
        next(err);
    }
});

// Speech to Text
router.post('/stt', async (req, res, next) => {
    try {
        const { audio, language } = req.body;

        if (!audio) {
            return res.status(400).json({
                success: false,
                error: 'Audio data is required'
            });
        }

        const lang = language || 'hi-IN';
        const result = await speechToText(audio, lang);

        res.json(result);
    } catch (err) {
        next(err);
    }
});

// Detect Language
router.post('/detect', async (req, res, next) => {
    try {
        const { text } = req.body;

        if (!text || text.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Text is required'
            });
        }

        const result = await detectLanguage(text);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
const axios = require('axios');

const SARVAM_BASE = process.env.SARVAM_BASE_URL || 'https://api.sarvam.ai';
const SARVAM_KEY = process.env.SARVAM_API_KEY;

const sarvamClient = axios.create({
    baseURL: SARVAM_BASE,
    timeout: 30000,
    headers: {
        'api-subscription-key': SARVAM_KEY,
        'Content-Type': 'application/json'
    }
});

// Translate text to target language
const translateText = async (text, sourceLang, targetLang) => {
    try {
        const response = await sarvamClient.post('/translate', {
            input: text,
            source_language_code: sourceLang,
            target_language_code: targetLang,
            speaker_gender: 'Male',
            mode: 'formal',
            enable_preprocessing: true
        });
        return {
            success: true,
            translatedText: response.data.translated_text
        };
    } catch (err) {
        console.error('Sarvam translate error:', err.message);
        return {
            success: false,
            translatedText: text,
            error: err.message
        };
    }
};

// Convert text to speech
const textToSpeech = async (text, language) => {
    try {
        const response = await sarvamClient.post('/text-to-speech', {
            inputs: [text],
            target_language_code: language,
            speaker: 'meera',
            pitch: 0,
            pace: 1.0,
            loudness: 1.5,
            enable_preprocessing: true,
            model: 'bulbul:v1'
        });
        return {
            success: true,
            audioBase64: response.data.audios[0]
        };
    } catch (err) {
        console.error('Sarvam TTS error:', err.message);
        return {
            success: false,
            audioBase64: null,
            error: err.message
        };
    }
};

// Convert speech to text
const speechToText = async (audioBase64, language) => {
    try {
        const response = await sarvamClient.post('/speech-to-text', {
            model: 'saarika:v1',
            language_code: language,
            audio: audioBase64
        });
        return {
            success: true,
            transcript: response.data.transcript
        };
    } catch (err) {
        console.error('Sarvam STT error:', err.message);
        return {
            success: false,
            transcript: '',
            error: err.message
        };
    }
};

// Detect language of input text
const detectLanguage = async (text) => {
    try {
        const response = await sarvamClient.post('/text-lid', {
            input: text
        });
        return {
            success: true,
            language: response.data.language_code
        };
    } catch (err) {
        console.error('Sarvam language detect error:', err.message);
        return {
            success: false,
            language: 'hi-IN',
            error: err.message
        };
    }
};

module.exports = {
    translateText,
    textToSpeech,
    speechToText,
    detectLanguage
};
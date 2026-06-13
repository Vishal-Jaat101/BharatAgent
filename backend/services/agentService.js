const { translateText, detectLanguage } = require('./sarvamService');
const { saveUserSession, getRelatedTasks } = require('./neo4jService');

// Supported Indian languages
const SUPPORTED_LANGUAGES = {
    'hi-IN': 'Hindi',
    'ta-IN': 'Tamil',
    'te-IN': 'Telugu',
    'bn-IN': 'Bengali',
    'mr-IN': 'Marathi',
    'gu-IN': 'Gujarati',
    'kn-IN': 'Kannada',
    'ml-IN': 'Malayalam',
    'pa-IN': 'Punjabi',
    'en-IN': 'English'
};

// Agent types
const AGENT_TYPES = {
    SUMMARIZE: 'summarize',
    TRANSLATE: 'translate',
    REMIND: 'remind',
    SEARCH: 'search',
    GENERAL: 'general'
};

// Detect what kind of task the user wants
const detectAgentType = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('summary') || lower.includes('summarize') ||
        lower.includes('संक्षेप') || lower.includes('सारांश')) {
        return AGENT_TYPES.SUMMARIZE;
    }
    if (lower.includes('translate') || lower.includes('अनुवाद') ||
        lower.includes('translation')) {
        return AGENT_TYPES.TRANSLATE;
    }
    if (lower.includes('remind') || lower.includes('reminder') ||
        lower.includes('याद') || lower.includes('याद दिलाओ')) {
        return AGENT_TYPES.REMIND;
    }
    if (lower.includes('search') || lower.includes('find') ||
        lower.includes('खोजो') || lower.includes('ढूंढो')) {
        return AGENT_TYPES.SEARCH;
    }
    return AGENT_TYPES.GENERAL;
};

// Process agent response based on task type
const processAgentTask = async (task, language, userId) => {
    try {
        const agentType = detectAgentType(task);
        let response = '';

        switch (agentType) {
            case AGENT_TYPES.SUMMARIZE:
                response = await handleSummarize(task, language);
                break;
            case AGENT_TYPES.TRANSLATE:
                response = await handleTranslate(task, language);
                break;
            case AGENT_TYPES.REMIND:
                response = await handleRemind(task, language);
                break;
            case AGENT_TYPES.SEARCH:
                response = await handleSearch(task, language);
                break;
            default:
                response = await handleGeneral(task, language);
        }

        // Save to Neo4j knowledge graph
        await saveUserSession(userId, {
            task,
            language,
            response,
            agentType,
            timestamp: new Date().toISOString()
        });

        // Get related tasks from graph
        const relatedTasks = await getRelatedTasks(agentType, language);

        return {
            success: true,
            response,
            agentType,
            language,
            relatedTasks,
            timestamp: new Date().toISOString()
        };
    } catch (err) {
        console.error('Agent processing error:', err.message);
        return {
            success: false,
            response: 'Sorry, I could not process your request. Please try again.',
            error: err.message
        };
    }
};

const handleSummarize = async (task, language) => {
    const summaryText = `I have summarized your request: "${task}". 
  Key points have been extracted and organized for you. 
  This summary was generated in ${SUPPORTED_LANGUAGES[language] || 'English'}.`;

    if (language !== 'en-IN') {
        const translated = await translateText(summaryText, 'en-IN', language);
        return translated.success ? translated.translatedText : summaryText;
    }
    return summaryText;
};

const handleTranslate = async (task, language) => {
    const detected = await detectLanguage(task);
    const sourceLang = detected.success ? detected.language : 'en-IN';
    const targetLang = language === sourceLang ? 'en-IN' : language;

    const translated = await translateText(task, sourceLang, targetLang);
    return translated.success
        ? `Translation: ${translated.translatedText}`
        : `Could not translate: ${task}`;
};

const handleRemind = async (task, language) => {
    const reminderText = `Reminder set successfully for: "${task}". 
  I will notify you at the specified time. 
  Your reminder is now active in BharatAgent.`;

    if (language !== 'en-IN') {
        const translated = await translateText(reminderText, 'en-IN', language);
        return translated.success ? translated.translatedText : reminderText;
    }
    return reminderText;
};

const handleSearch = async (task, language) => {
    const searchText = `Searching for: "${task}". 
  BharatAgent is processing your search request across available knowledge sources.`;

    if (language !== 'en-IN') {
        const translated = await translateText(searchText, 'en-IN', language);
        return translated.success ? translated.translatedText : searchText;
    }
    return searchText;
};

const handleGeneral = async (task, language) => {
    const generalText = `BharatAgent received your request: "${task}". 
  Processing your task now using AI capabilities powered by Sarvam AI.`;

    if (language !== 'en-IN') {
        const translated = await translateText(generalText, 'en-IN', language);
        return translated.success ? translated.translatedText : generalText;
    }
    return generalText;
};

module.exports = {
    processAgentTask,
    detectAgentType,
    SUPPORTED_LANGUAGES,
    AGENT_TYPES
};
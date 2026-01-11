const config = require('../config');
const axios = require('axios');

class ModerationService {
    
    constructor() {
        this.apiKey = config.moderation?.apiKey; // Assuming added to config
    }

    async checkContent(text, type = 'text') {
        if (!config.moderation?.enableAutoModeration) return { isSafe: true };
        
        // Mock Implementation
        // In real world: Call OpenAI Moderation API or Google Cloud Natural Language
        
        const badWords = ['bad', 'hate', 'violence']; // Simple regex check
        const hasBadWord = badWords.some(word => text.toLowerCase().includes(word));

        if (hasBadWord) {
            return { 
                isSafe: false, 
                reason: 'Contains prohibited words', 
                categories: ['profanity'] 
            };
        }

        return { isSafe: true };
    }
}

module.exports = new ModerationService();

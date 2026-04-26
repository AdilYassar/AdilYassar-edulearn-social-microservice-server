const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const config = require('./index');
const logger = require('../utils/logger');

let firebaseApp;

const initFirebase = () => {
    if (firebaseApp) return firebaseApp;

    try {
        // Firebase service account from environment variable
        // Can be: file path, JSON string, or base64 encoded JSON
        const serviceAccountInput = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        
        if (!serviceAccountInput) {
            logger.warn('Firebase service account not configured. Push notifications disabled.');
            return null;
        }

        let serviceAccount;
        
        // Try loading as file path first
        if (serviceAccountInput.endsWith('.json')) {
            try {
                const filePath = path.join(process.cwd(), serviceAccountInput);
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                serviceAccount = JSON.parse(fileContent);
            } catch (e) {
                throw new Error(`Failed to load Firebase credentials from file: ${serviceAccountInput}. ${e.message}`);
            }
        } else {
            // Try parsing as JSON string
            try {
                serviceAccount = JSON.parse(serviceAccountInput);
            } catch (e) {
                // Try decoding as base64
                try {
                    serviceAccount = JSON.parse(Buffer.from(serviceAccountInput, 'base64').toString());
                } catch (e2) {
                    throw new Error('Invalid Firebase service account format');
                }
            }
        }

        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id,
        });

        logger.info('Firebase initialized successfully');
        return firebaseApp;
    } catch (error) {
        logger.error('Failed to initialize Firebase:', error.message);
        return null;
    }
};

const getFirebaseMessaging = () => {
    const app = initFirebase();
    return app ? admin.messaging(app) : null;
};

module.exports = {
    initFirebase,
    getFirebaseMessaging,
    admin
};

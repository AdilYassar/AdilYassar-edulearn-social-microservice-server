const { google } = require('googleapis');
const config = require('../config');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Store refresh token in config/env
// Using provided credentials
const CLIENT_ID = config.googleDrive.clientId;
const CLIENT_SECRET = config.googleDrive.clientSecret;
const REDIRECT_URI = config.googleDrive.redirectUri;
const REFRESH_TOKEN = config.googleDrive.refreshToken; 
const FOLDER_ID = config.googleDrive.folderId;

class MediaService {
    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            CLIENT_ID,
            CLIENT_SECRET,
            REDIRECT_URI
        );

        if (REFRESH_TOKEN) {
             this.oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
        } else {
            logger.warn('Google Drive Refresh Token missing. Media uploads will fail.');
        }

        this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    }

    /**
     * Upload a file to Google Drive
     * This implementation assumes the file is temporarily saved on the server disk by multer.
     * In a robust microservice, you might stream directly or generating a signed upload URL 
     * (but GDrive API doesn't support pre-signed PUT URLs like S3 easily for public).
     * 
     * Standard flow: Client POSTs file -> Server uploads to GDrive -> Server returns ID.
     */
    async uploadFile(filePath, fileName, mimeType) {
        try {
            const fileMetadata = {
                name: fileName,
                parents: [FOLDER_ID]
            };
            
            const media = {
                mimeType: mimeType,
                body: fs.createReadStream(filePath)
            };

            const response = await this.drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id, webContentLink, webViewLink, thumbnailLink'
            });

            // Make file publicly readable (optional, depends on privacy)
            // await this.drive.permissions.create({
            //     fileId: response.data.id,
            //     requestBody: {
            //         role: 'reader',
            //         type: 'anyone'
            //     }
            // });

            return {
                id: response.data.id,
                url: response.data.webViewLink,
                downloadUrl: response.data.webContentLink,
                thumbnail: response.data.thumbnailLink
            };
        } catch (error) {
            logger.error(`Google Drive upload failed: ${error.message}`);
            throw new Error('File upload failed');
        } finally {
            // Cleanup temp file
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    }

    async deleteFile(fileId) {
        try {
            await this.drive.files.delete({ fileId });
            return true;
        } catch (error) {
            logger.error(`Google Drive delete failed: ${error.message}`);
            return false;
        }
    }

    // Helper for generating auth url if refresh token needs to be obtained manually only once
    getAuthUrl() {
        const scopes = ['https://www.googleapis.com/auth/drive.file'];
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes
        });
    }
}

module.exports = new MediaService();

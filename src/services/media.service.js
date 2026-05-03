const { google } = require('googleapis');
const config = require('../config');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffprobePath = require('ffprobe-static').path;
const logger = require('../utils/logger');

// Configure ffmpeg
ffmpeg.setFfprobePath(ffprobePath);

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

    async getVideoMetadata(filePath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err) return reject(err);
                const { width, height } = metadata.streams.find(s => s.width && s.height) || {};
                resolve({
                    width,
                    height,
                    aspectRatio: width / height,
                    duration: metadata.format.duration
                });
            });
        });
    }

    async uploadFile(filePath, fileName, mimeType) {
        try {
            // Extract dimensions for images and videos
            let dimensions = {};
            if (mimeType.startsWith('image/')) {
                try {
                    const metadata = await sharp(filePath).metadata();
                    dimensions = {
                        width: metadata.width,
                        height: metadata.height,
                        aspectRatio: metadata.width / metadata.height
                    };
                } catch (err) {
                    logger.error(`Failed to extract image dimensions: ${err.message}`);
                }
            } else if (mimeType.startsWith('video/')) {
                try {
                    dimensions = await this.getVideoMetadata(filePath);
                } catch (err) {
                    logger.error(`Failed to extract video dimensions: ${err.message}`);
                }
            }

            const fileMetadata = {
                name: fileName,
                parents: [FOLDER_ID]
            };
            
            const media = {
                mimeType: mimeType,
                body: fs.createReadStream(filePath)
            };

            // 1. Upload the file
            const response = await this.drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id, webContentLink, webViewLink, thumbnailLink'
            });

            const fileId = response.data.id;

            // 2. Make the file public (Required for direct URL access)
            await this.drive.permissions.create({
                fileId: fileId,
                requestBody: {
                    role: 'reader',
                    type: 'anyone'
                }
            });

            // 3. Construct the Direct Direct Link for React Native
            // For videos, use the direct 'uc' format as requested
            let directUrl = response.data.webViewLink;
            if (mimeType.startsWith('video/') || mimeType.startsWith('image/') || mimeType.startsWith('audio/')) {
                directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
            }

            return {
                id: fileId,
                url: directUrl,
                downloadUrl: response.data.webContentLink,
                thumbnail: response.data.thumbnailLink,
                mimeType: mimeType,
                ...dimensions
            };
        } catch (error) {
            logger.error(`Google Drive upload failed:`, error);
            throw new Error(`Google Drive API error: ${error.message}`);
        } finally {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    }

    async getFileUrl(fileId) {
        try {
            const response = await this.drive.files.get({
                fileId,
                fields: 'webViewLink, mimeType'
            });
            
            if (response.data.mimeType.startsWith('video/')) {
                return `https://drive.google.com/uc?export=view&id=${fileId}`;
            }
            return response.data.webViewLink;
        } catch (error) {
            logger.error(`Failed to get file URL: ${error.message}`);
            throw error;
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
}

module.exports = new MediaService();

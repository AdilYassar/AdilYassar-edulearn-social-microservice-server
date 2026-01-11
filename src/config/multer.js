const multer = require('multer');
const path = require('path');
const logger = require('../utils/logger');
const config = require('./index');
const fs = require('fs');

const uploadDir = 'tmp/uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
        'video/mp4', 'video/quicktime', 'application/pdf', 
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'text/plain',
        'application/octet-stream' // Fallback for some browsers
    ];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}`), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: config.fileUpload?.maxSize || 100 * 1024 * 1024
    },
    fileFilter: fileFilter
});

module.exports = upload;

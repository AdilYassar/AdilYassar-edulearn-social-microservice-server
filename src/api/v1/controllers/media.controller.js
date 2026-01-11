const mediaService = require('../../../services/media.service');

exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'No file uploaded' });
        }

        const result = await mediaService.uploadFile(
            req.file.path,
            req.file.originalname,
            req.file.mimetype
        );

        res.status(201).json({ status: 'success', data: result });
    } catch (error) {
        require('../../../utils/logger').error('Upload Controller Error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Deprecate or remove getUploadUrl if doing server-side upload via Multer
// But if staying with Client->Drive direct, distinct logic needed.
// This implementation assumes Client -> Server (Multer) -> Drive.

exports.getFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const url = await mediaService.getFileUrl(fileId);
        res.status(200).json({ status: 'success', data: { url } }); // Redirect usually? or just return URL
    } catch (error) {
         res.status(404).json({ status: 'error', message: error.message });
    }
};

exports.deleteFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const result = await mediaService.deleteFile(fileId);
        if (result) {
            res.status(200).json({ status: 'success', message: 'File deleted' });
        } else {
             res.status(400).json({ status: 'error', message: 'Failed to delete file' });
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

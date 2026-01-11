const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/media.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const upload = require('../../../config/multer');

router.use(authenticate);

// Use multer 'file' field name
router.post('/upload', upload.single('file'), mediaController.uploadFile);
router.get('/:fileId', mediaController.getFile);
router.delete('/:fileId', mediaController.deleteFile);

module.exports = router;

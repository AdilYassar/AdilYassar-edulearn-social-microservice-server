const express = require('express');
const router = express.Router();
const messageRequestController = require('../controllers/message-request.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const schemas = require('../validators/request.validator');
const validate = require('../middlewares/validation.middleware');

router.use(authenticate);

router.post('/', validate(schemas.sendRequest), messageRequestController.createRequest);
router.get('/', messageRequestController.getRequests);
router.put('/:id/accept', messageRequestController.acceptRequest);
router.put('/:id/reject', messageRequestController.rejectRequest);

module.exports = router;

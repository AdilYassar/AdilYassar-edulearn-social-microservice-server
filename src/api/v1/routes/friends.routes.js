const express = require('express');
const router = express.Router();
const friendsController = require('../controllers/friends.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const schemas = require('../validators/friend.validator');
const validate = require('../middlewares/validation.middleware');

router.use(authenticate);

router.get('/', friendsController.getFriends);
router.get('/requests', friendsController.getRequests);
router.post('/request', validate(schemas.sendRequest), friendsController.sendRequest);
router.post('/accept', validate(schemas.acceptRequest), friendsController.acceptRequest);
router.post('/reject', validate(schemas.rejectRequest), friendsController.rejectRequest);

router.post('/block/:uuid', friendsController.blockUser); 
router.delete('/unblock/:uuid', friendsController.unblockUser);
router.get('/suggestions', friendsController.getSuggestions);

module.exports = router;

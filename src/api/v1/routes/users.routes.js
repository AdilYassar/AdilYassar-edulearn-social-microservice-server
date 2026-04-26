const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/me', usersController.getMe);
router.patch('/me', usersController.updateMe);
router.get('/discover', usersController.discover);
router.get('/search', usersController.search);
router.get('/:uuid', usersController.getUser);

module.exports = router;

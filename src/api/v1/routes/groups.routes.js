const express = require('express');
const router = express.Router();
const groupsController = require('../controllers/groups.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const schemas = require('../validators/group.validator');
const validate = require('../middlewares/validation.middleware');

router.use(authenticate);

router.post('/', validate(schemas.createGroup), groupsController.createGroup);
router.get('/', groupsController.getGroups);
router.get('/:id', groupsController.getGroup);

router.post('/:id/members', validate(schemas.addMember), groupsController.addMember);

module.exports = router;

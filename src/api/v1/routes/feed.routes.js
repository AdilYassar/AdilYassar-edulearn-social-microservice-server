const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feed.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const schemas = require('../validators/post.validator');
const validate = require('../middlewares/validation.middleware');

router.use(authenticate);

// Saved Posts Management
router.get('/saved', feedController.getSavedPosts);
router.post('/:id/save', feedController.toggleSavePost);

router.post('/', validate(schemas.createPost), feedController.createPost);
router.get('/', feedController.getFeed);
router.get('/:id', feedController.getPost);
router.put('/:id', feedController.updatePost);
router.delete('/:id', feedController.deletePost);

router.post('/:id/like', feedController.likePost);
router.get('/:id/comments', feedController.getComments);
router.post('/:id/comments', validate(schemas.comment), feedController.commentOnPost);
router.delete('/:postId', feedController.deletePost);

// Comment Management
router.delete('/comments/:commentId', feedController.deleteComment);
router.post('/comments/:commentId/like', feedController.likeComment);

module.exports = router;

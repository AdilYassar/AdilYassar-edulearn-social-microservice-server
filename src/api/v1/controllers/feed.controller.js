const feedService = require('../../../services/feed.service');

exports.getFeed = async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const feed = await feedService.getFeed(req.user.quizServerUUID, parseInt(page));
        res.status(200).json({ status: 'success', data: feed });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.createPost = async (req, res) => {
    try {
        const { type, content, visibility, courseId } = req.body;
        const post = await feedService.createPost(
            req.user.quizServerUUID, 
            type, 
            content, 
            visibility, 
            courseId
        );
        res.status(201).json({ status: 'success', data: post });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

exports.likePost = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const result = await feedService.likePost(req.user.quizServerUUID, postId);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
         res.status(400).json({ status: 'error', message: error.message });
    }
};

exports.commentOnPost = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const { content, parentId } = req.body;
        const comment = await feedService.addComment(req.user.quizServerUUID, postId, content, parentId);
        res.status(201).json({ status: 'success', data: comment });
    } catch (error) {
         res.status(400).json({ status: 'error', message: error.message });
    }
};

exports.getPost = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const post = await feedService.getPost(postId);
        res.status(200).json({ status: 'success', data: post });
    } catch (error) {
        res.status(404).json({ status: 'error', message: error.message });
    }
};

exports.updatePost = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const { content } = req.body;
        const post = await feedService.updatePost(req.user.quizServerUUID, postId, content);
        res.status(200).json({ status: 'success', data: post });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

exports.deletePost = async (req, res) => {
    try {
        const { id: postId } = req.params;
        await feedService.deletePost(req.user.quizServerUUID, postId);
        res.status(200).json({ status: 'success', message: 'Post deleted' });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

exports.getComments = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const { page, parentId } = req.query;
        const comments = await feedService.getComments(postId, parseInt(page), parentId);
        res.status(200).json({ status: 'success', data: comments });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        await feedService.deleteComment(req.user.quizServerUUID, commentId);
        res.status(200).json({ status: 'success', message: 'Comment deleted' });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

exports.likeComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const result = await feedService.likeComment(req.user.quizServerUUID, commentId);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

exports.toggleSavePost = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const result = await feedService.toggleSavePost(req.user.quizServerUUID, postId);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

exports.getSavedPosts = async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const posts = await feedService.getSavedPosts(req.user.quizServerUUID, parseInt(page));
        res.status(200).json({ status: 'success', data: posts });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

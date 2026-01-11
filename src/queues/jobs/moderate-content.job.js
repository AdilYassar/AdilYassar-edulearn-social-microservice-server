const { moderationQueue } = require('../index');

exports.add = (postId, content) => {
    moderationQueue.add({
        postId,
        content
    }, {
        priority: 1, // High priority
        attempts: 1,
        removeOnComplete: true
    });
};

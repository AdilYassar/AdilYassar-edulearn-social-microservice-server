const logger = require('../../utils/logger');
const Post = require('../../models/Post');

module.exports = async (job) => {
    const { postId, content } = job.data;
    logger.debug(`Processing moderation job ${job.id} for post ${postId}`);

    try {
        // Mock external moderation API check
        // const result = await externalModerationApi.check(content);
        const isSafe = true; // Assume safe for now

        if (isSafe) {
            await Post.findByIdAndUpdate(postId, { 
                moderationStatus: 'approved',
                isModerated: true,
                moderatedAt: new Date()
            });
        } else {
            await Post.findByIdAndUpdate(postId, { 
                moderationStatus: 'rejected', 
                moderationReason: 'Automated content filter',
                isModerated: true,
                moderatedAt: new Date()
            });
        }

        return { moderated: true, status: isSafe ? 'approved' : 'rejected' };
    } catch (err) {
        logger.error(`Moderation job failed: ${err.message}`);
        throw err;
    }
};

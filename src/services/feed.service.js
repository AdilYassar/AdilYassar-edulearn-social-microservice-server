const postRepository = require('../repositories/post.repository');
const likeRepository = require('../repositories/like.repository');
const commentRepository = require('../repositories/comment.repository');
const userRepository = require('../repositories/user.repository');
const friendshipRepository = require('../repositories/friendship.repository');
const logger = require('../utils/logger');

class FeedService {

  async createPost(authorUUID, type, content, visibility = 'public', courseId) {
    const post = await postRepository.create({
      authorUUID,
      type,
      content,
      visibility,
      courseId
    });
    return post;
  }

  async getFeed(userUUID, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // 1. Get Friend UUIDs
    const friendships = await friendshipRepository.findFriends(userUUID);
    const friendUUIDs = friendships.map(f => 
       f.requesterUUID === userUUID ? f.recipientUUID : f.requesterUUID
    );

    // 2. Fetch Posts
    const query = {
        $or: [
            { authorUUID: userUUID },
            { 
              authorUUID: { $in: friendUUIDs },
              visibility: { $in: ['public', 'friends'] }     
            }
        ],
        isDeleted: false,
        moderationStatus: 'approved'
    };

    const posts = await postRepository.findFeed(query, skip, limit);
    // Note: repository.findFeed returns mongoose docs. If need lean, repo should lean() or we convert.
    // Assuming Repo returns docs or objects. If docs, .map works but .toObject() needed for mutation usually.
    // Let's assume Repo returns docs.

    // Populate Author info
    const uniqueAuthors = [...new Set(posts.map(p => p.authorUUID))];
    const authors = await userRepository.findMany(uniqueAuthors);
    
    // Check if I liked them
    const postIds = posts.map(p => p._id);
    const myLikes = await likeRepository.findMany(userUUID, 'post', postIds);
    const likedMap = new Set(myLikes.map(l => l.targetId.toString()));

    // Merge Details
    const feed = posts.map(post => {
        const postObj = post.toObject ? post.toObject() : post;
        const author = authors.find(a => a.quizServerUUID === postObj.authorUUID);
        return {
            ...postObj,
            author: author ? {
                name: author.name,
                avatar: author.avatar,
                quizServerUUID: author.quizServerUUID
            } : { name: 'Unknown', quizServerUUID: postObj.authorUUID },
            isLiked: likedMap.has(postObj._id.toString())
        };
    });

    return feed;
  }

  async likePost(userUUID, postId) {
    const existing = await likeRepository.find(userUUID, 'post', postId);

    if (existing) { // Unlike
        await likeRepository.delete(existing._id);
        await postRepository.updateStats(postId, { "stats.likes": -1 });
        return { isLiked: false };
    } else { // Like
        await likeRepository.create({
             userUUID,
             targetType: 'post',
             targetId: postId
        });
        await postRepository.updateStats(postId, { "stats.likes": 1 });
        return { isLiked: true };
    }
  }

  async addComment(userUUID, postId, content) {
      const comment = await commentRepository.create({
          postId,
          authorUUID: userUUID,
          content: { text: content }
      });

      await postRepository.updateStats(postId, { "stats.comments": 1 });
      
      return comment;
  }

  async getPost(postId) {
      const post = await postRepository.findById(postId);
      if (!post) throw new Error('Post not found');
      return post; // lean?
  }

  async updatePost(userUUID, postId, content) {
      const post = await postRepository.findOwned(postId, userUUID);
      if (!post) throw new Error('Post not found or unauthorized');

      post.content = { ...post.content, ...content };
      post.isEdited = true;
      post.editedAt = new Date();
      // Using save on document returned by Repo
      return await post.save(); 
  }

  async deletePost(userUUID, postId) {
      const post = await postRepository.findOwned(postId, userUUID);
      if (!post) throw new Error('Post not found or unauthorized');

      post.isDeleted = true;
      post.deletedAt = new Date();
      await post.save();
      return { status: 'deleted' };
  }

  async getComments(postId, page = 1, limit = 50) {
      const skip = (page - 1) * limit;
      const comments = await commentRepository.findByPost(postId, skip, limit);
      
      const authorUUIDs = [...new Set(comments.map(c => c.authorUUID))];
      const authors = await userRepository.findMany(authorUUIDs);

      return comments.map(c => ({
          ...c,
          author: authors.find(a => a.quizServerUUID === c.authorUUID) || { name: 'Unknown', quizServerUUID: c.authorUUID }
      }));
  }

  async deleteComment(userUUID, commentId) {
      const comment = await commentRepository.findOwned(commentId, userUUID);
      if (!comment) throw new Error('Comment not found or unauthorized');

      comment.isDeleted = true;
      comment.deletedAt = new Date();
      await comment.save();
      
      await postRepository.updateStats(comment.postId, { "stats.comments": -1 });
      
      return { status: 'deleted' };
  }

  async likeComment(userUUID, commentId) {
    const existing = await likeRepository.find(userUUID, 'comment', commentId);

    if (existing) {
        await likeRepository.delete(existing._id);
        await commentRepository.update(commentId, { $inc: { "stats.likes": -1 } });
        return { isLiked: false };
    } else {
        await likeRepository.create({
             userUUID,
             targetType: 'comment',
             targetId: commentId
        });
        await commentRepository.update(commentId, { $inc: { "stats.likes": 1 } });
        return { isLiked: true };
    }
  }
}

module.exports = new FeedService();

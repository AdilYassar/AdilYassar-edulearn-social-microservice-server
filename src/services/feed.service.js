const postRepository = require('../repositories/post.repository');
const likeRepository = require('../repositories/like.repository');
const commentRepository = require('../repositories/comment.repository');
const userRepository = require('../repositories/user.repository');
const friendshipRepository = require('../repositories/friendship.repository');
const firebaseNotificationService = require('./firebase-notification.service');
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

    // Notify ALL (Broadcast for new posts - standard notification)
    const author = await userRepository.findByUUID(authorUUID);
    firebaseNotificationService.broadcast('post_new', {
        title: 'New Post',
        body: `${author?.name || 'Someone'} shared a new post`
    }, { targetType: 'post', targetId: post._id, actorUUID: authorUUID });

    // Notify Friends via Data Message (Real-time Feed Update)
    try {
        const friendships = await friendshipRepository.findFriends(authorUUID);
        const friendUUIDs = friendships.map(f => 
            f.requesterUUID === authorUUID ? f.recipientUUID : f.requesterUUID
        );
        
        if (friendUUIDs.length > 0) {
            await firebaseNotificationService.sendDataToUsers(friendUUIDs, {
                subType: 'POST_CREATED',
                payload: JSON.stringify(post)
            });
        }
    } catch (error) {
        logger.error(`Failed to broadcast POST_CREATED event: ${error.message}`);
    }

    return post;
  }

  async getFeed(userUUID, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // 1. Get Friend UUIDs
    const friendships = await friendshipRepository.findFriends(userUUID);
    const friendUUIDs = friendships.map(f => 
       f.requesterUUID === userUUID ? f.recipientUUID : f.requesterUUID
    );

    // 2. Fetch Posts - Include all public posts + friend-only posts from friends
    const query = {
        $or: [
            { visibility: 'public' },  // All public posts for everyone
            { 
              authorUUID: { $in: friendUUIDs },
              visibility: 'friends'     // Friends-only posts only from friends
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
    const feed = await Promise.all(posts.map(async post => {
        const postObj = post.toObject ? post.toObject() : post;
        const author = authors.find(a => a.quizServerUUID === postObj.authorUUID);
        
        // Fetch comments for this post
        const comments = await commentRepository.findByPost(postObj._id, 0, 10); // Get top 10 comments
        const commentAuthorUUIDs = [...new Set(comments.map(c => c.authorUUID))];
        const commentAuthors = await userRepository.findMany(commentAuthorUUIDs);

        const enrichedComments = comments.map(c => ({
            ...c.toObject ? c.toObject() : c,
            author: commentAuthors.find(a => a.quizServerUUID === c.authorUUID) || { name: 'Unknown' }
        }));

        return {
            ...postObj,
            author: author ? {
                name: author.name,
                avatar: author.avatar,
                quizServerUUID: author.quizServerUUID
            } : { name: 'Unknown', quizServerUUID: postObj.authorUUID },
            isLiked: likedMap.has(postObj._id.toString()),
            comments: enrichedComments
        };
    }));

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
        
        // Notify author
        const post = await postRepository.findById(postId);
        if (post && post.authorUUID !== userUUID) {
            const liker = await userRepository.findByUUID(userUUID);
            firebaseNotificationService.sendToUser(post.authorUUID, 'post_like', {
                title: 'New Like',
                body: `${liker?.name || 'Someone'} liked your post`
            }, { targetType: 'post', targetId: postId, actorUUID: userUUID });
        }

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
      
      // Notify author
      const post = await postRepository.findById(postId);
      if (post && post.authorUUID !== userUUID) {
          const commenter = await userRepository.findByUUID(userUUID);
          firebaseNotificationService.sendToUser(post.authorUUID, 'post_comment', {
              title: 'New Comment',
              body: `${commenter?.name || 'Someone'} commented on your post`
          }, { targetType: 'post', targetId: postId, actorUUID: userUUID });
      }

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

      // Only update fields that are provided to avoid undefined spreading
      if (content.text !== undefined) post.content.text = content.text;
      if (content.media !== undefined) post.content.media = content.media;
      if (content.progress !== undefined) post.content.progress = content.progress;
      if (content.question !== undefined) post.content.question = content.question;
      
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

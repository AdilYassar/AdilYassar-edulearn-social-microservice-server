const postRepository = require('../repositories/post.repository');
const likeRepository = require('../repositories/like.repository');
const commentRepository = require('../repositories/comment.repository');
const userRepository = require('../repositories/user.repository');
const savedPostRepository = require('../repositories/saved-post.repository');
const friendshipRepository = require('../repositories/friendship.repository');
const firebaseNotificationService = require('./firebase-notification.service');
const logger = require('../utils/logger');

class FeedService {

  async createPost(authorUUID, type, content, visibility = 'public', courseId) {
    // Determine contentType
    let contentType = 'text';
    if (content.media && content.media.length > 0) {
      contentType = content.media[0].type; // 'image' or 'video'
    }

    const post = await postRepository.create({
      authorUUID,
      type,
      contentType,
      content,
      visibility,
      courseId
    });

    // ── NOTIFICATIONS ──
    const author = await userRepository.findByUUID(authorUUID);
    const postData = { targetType: 'post', targetId: post._id, actorUUID: authorUUID };
    
    // 1. Get Friend UUIDs
    const friendships = await friendshipRepository.findFriends(authorUUID);
    const friendUUIDs = friendships.map(f => 
        f.requesterUUID === authorUUID ? f.recipientUUID : f.requesterUUID
    );

    if (type === 'announcement') {
        // Global broadcast for announcements
        firebaseNotificationService.broadcast('post_new', {
            title: 'New Announcement',
            body: `${author?.name || 'Someone'} posted an announcement: ${content.text?.substring(0, 50)}...`
        }, postData);
    } else {
        // Targeted visible notification + data sync for FRIENDS ONLY
        if (friendUUIDs.length > 0) {
            firebaseNotificationService.sendToUsers(friendUUIDs, 'post_new', {
                title: 'New Post',
                body: `${author?.name || 'Someone'} shared a new post`
            }, {
                ...postData,
                subType: 'POST_CREATED',
                payload: JSON.stringify(post)
            });
        }
    }

    // 2. Fallback: Still send silent data sync to friends if they weren't notified visibly
    // (Actually sendToUsers already does combined, but if we want to ensure feed updates for everyone else...)
    // For now, let's keep it clean. Friends get ONE message.
    
    return post;
  }

  async getFeed(userUUID, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // 1. Get Friend UUIDs for visibility
    const friendships = await friendshipRepository.findFriends(userUUID);
    const friendUUIDs = friendships.map(f => 
       f.requesterUUID === userUUID ? f.recipientUUID : f.requesterUUID
    );

    // 2. Fetch Posts
    const query = {
        $or: [
            { visibility: 'public' },
            { authorUUID: { $in: friendUUIDs }, visibility: 'friends' }
        ],
        isDeleted: false,
        moderationStatus: 'approved'
    };
    const posts = await postRepository.findFeed(query, skip, limit);
    
    // 3. Batch fetch all Authors and Interaction States
    const uniqueAuthors = [...new Set(posts.map(p => p.authorUUID))];
    const postIds = posts.map(p => p._id);
    
    // Pre-fetch all comments to avoid N+1 queries for comment authors
    const allComments = await Promise.all(posts.map(p => commentRepository.findByPost(p._id, 0, 3)));
    const flatComments = allComments.flat();
    const allCommentAuthorUUIDs = [...new Set(flatComments.map(c => c.authorUUID))];
    const allCommentIds = flatComments.map(c => c._id);

    const [authors, myLikes, mySaves, commentAuthors, myCommentLikes] = await Promise.all([
        userRepository.findMany(uniqueAuthors),
        likeRepository.findMany(userUUID, 'post', postIds),
        savedPostRepository.findMany(userUUID, postIds),
        userRepository.findMany(allCommentAuthorUUIDs),
        likeRepository.findMany(userUUID, 'comment', allCommentIds)
    ]);
    
    const likedMap = new Set(myLikes.map(l => l.targetId.toString()));
    const savedMap = new Set(mySaves.map(s => s.postId.toString()));
    const likedCommentsMap = new Set(myCommentLikes.map(l => l.targetId.toString()));

    // 4. Enrich each post
    const feed = posts.map((post, index) => {
        const postObj = post.toObject ? post.toObject() : post;
        const author = authors.find(a => a.quizServerUUID === postObj.authorUUID);
        const comments = allComments[index];

        const enrichedComments = comments.map(c => ({
            ...c,
            author: commentAuthors.find(a => a.quizServerUUID === c.authorUUID) || { name: 'Unknown' },
            isLiked: likedCommentsMap.has(c._id.toString())
        }));

        return {
            ...postObj,
            author: author ? {
                name: author.name,
                avatar: author.avatar,
                quizServerUUID: author.quizServerUUID,
                learningStats: author.learningStats
            } : { name: 'Unknown', quizServerUUID: postObj.authorUUID },
            isLiked: likedMap.has(postObj._id.toString()),
            isSaved: savedMap.has(postObj._id.toString()),
            comments: enrichedComments
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

  async addComment(userUUID, postId, content, parentId = null) {
      const comment = await commentRepository.create({
          postId,
          authorUUID: userUUID,
          content: { text: content },
          parentId
      });

      // Update counts
      if (parentId) {
          await commentRepository.updateStats(parentId, { "stats.replies": 1 });
          
          // Notify Comment Author
          const parentComment = await commentRepository.findById(parentId);
          if (parentComment && parentComment.authorUUID !== userUUID) {
              const replier = await userRepository.findByUUID(userUUID);
              firebaseNotificationService.sendToUser(parentComment.authorUUID, 'comment_reply', {
                  title: 'New Reply',
                  body: `${replier?.name || 'Someone'} replied to your comment`
              }, { 
                targetType: 'comment', 
                targetId: parentId, 
                actorUUID: userUUID,
                data: { postId } 
              });
          }
      } else {
          await postRepository.updateStats(postId, { "stats.comments": 1 });
          
          // Notify Post Author
          const post = await postRepository.findById(postId);
          if (post && post.authorUUID !== userUUID) {
              const commenter = await userRepository.findByUUID(userUUID);
              firebaseNotificationService.sendToUser(post.authorUUID, 'post_comment', {
                  title: 'New Comment',
                  body: `${commenter?.name || 'Someone'} commented on your post`
              }, { targetType: 'post', targetId: postId, actorUUID: userUUID });
          }
      }

      return comment;
  }

  async likeComment(userUUID, commentId) {
      const existing = await likeRepository.find(userUUID, 'comment', commentId);
      
      if (existing) {
          await likeRepository.delete(existing._id);
          await commentRepository.updateStats(commentId, { "stats.likes": -1 });
          return { isLiked: false };
      } else {
          await likeRepository.create({
              userUUID,
              targetType: 'comment',
              targetId: commentId
          });
          await commentRepository.updateStats(commentId, { "stats.likes": 1 });
          
          // Notify author
          const comment = await commentRepository.findById(commentId);
          if (comment && comment.authorUUID !== userUUID) {
              const liker = await userRepository.findByUUID(userUUID);
              firebaseNotificationService.sendToUser(comment.authorUUID, 'comment_like', {
                  title: 'Comment Liked',
                  body: `${liker?.name || 'Someone'} liked your comment`
              }, { 
                targetType: 'comment', 
                targetId: commentId, 
                actorUUID: userUUID,
                data: { postId: comment.postId }
              });
          }

          return { isLiked: true };
      }
  }

  async getComments(postId, page = 1, parentId = null) {
      const skip = (page - 1) * 10;
      const comments = await commentRepository.findByPost(postId, skip, 10, parentId);
      
      const authorUUIDs = [...new Set(comments.map(c => c.authorUUID))];
      const authors = await userRepository.findMany(authorUUIDs);

      return comments.map(c => ({
          ...c,
          author: authors.find(a => a.quizServerUUID === c.authorUUID) || { name: 'Unknown' }
      }));
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
      if (content.media !== undefined) {
          post.content.media = content.media;
          // Update contentType based on new media
          if (content.media.length > 0) {
              post.contentType = content.media[0].type;
          } else {
              post.contentType = 'text';
          }
      }
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



  async toggleSavePost(userUUID, postId) {
    const existing = await savedPostRepository.find(userUUID, postId);

    if (existing) { // Unsave
        await savedPostRepository.delete(existing._id);
        return { isSaved: false };
    } else { // Save
        await savedPostRepository.create({
             userUUID,
             postId
        });
        
        // Notify author
        const post = await postRepository.findById(postId);
        if (post && post.authorUUID !== userUUID) {
            const saver = await userRepository.findByUUID(userUUID);
            firebaseNotificationService.sendToUser(post.authorUUID, 'post_saved', {
                title: 'Post Saved',
                body: `${saver?.name || 'Someone'} saved your post`
            }, { targetType: 'post', targetId: postId, actorUUID: userUUID });
        }

        return { isSaved: true };
    }
  }

  async getSavedPosts(userUUID, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const savedRecords = await savedPostRepository.findByUser(userUUID, skip, limit);
    
    // Convert to standard post format
    const posts = savedRecords.map(r => r.postId).filter(p => p != null);
    
    // Populate additional details (isLiked, author info, etc)
    const enrichedPosts = await Promise.all(posts.map(async post => {
        const postObj = post.toObject ? post.toObject() : post;
        
        // Basic author info
        const author = await userRepository.findByUUID(postObj.authorUUID);
        
        // Check if I liked it
        const liked = await likeRepository.find(userUUID, 'post', postObj._id);

        return {
            ...postObj,
            author: author ? {
                name: author.name,
                avatar: author.avatar,
                quizServerUUID: author.quizServerUUID
            } : { name: 'Unknown', quizServerUUID: postObj.authorUUID },
            isLiked: !!liked,
            isSaved: true // By definition in this list
        };
    }));

    return enrichedPosts;
  }
}

module.exports = new FeedService();

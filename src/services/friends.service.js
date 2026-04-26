const friendshipRepository = require('../repositories/friendship.repository');
const userRepository = require('../repositories/user.repository');
const firebaseNotificationService = require('./firebase-notification.service');
const logger = require('../utils/logger');

class FriendService {
  
  async sendRequest(requesterUUID, recipientUUID, message) {
    if (requesterUUID === recipientUUID) {
      throw new Error('Cannot add yourself as a friend');
    }

    const existing = await friendshipRepository.findExisting(requesterUUID, recipientUUID);

    if (existing) {
      if (existing.status === 'blocked') {
        throw new Error('Cannot send friend request');
      }
      if (existing.status === 'accepted') {
        throw new Error('Already friends');
      }
      if (existing.status === 'pending') {
        throw new Error('Friend request already pending');
      }
      // Resend logic
       existing.status = 'pending';
       existing.requesterUUID = requesterUUID;
       existing.recipientUUID = recipientUUID;
       existing.message = message;
        existing.requestedAt = new Date();
        existing.respondedAt = undefined;
        await friendshipRepository.save(existing);
        
        // Notify
        const requester = await userRepository.findByUUID(requesterUUID);
        const requesterName = (requester?.name && requester.name !== 'User') ? requester.name : 'A user';

        firebaseNotificationService.sendToUser(recipientUUID, 'friend_request', {
            title: 'New Friend Request',
            body: `${requesterName} sent you a friend request`
        }, { actorUUID: requesterUUID });

        // Trigger Data Message for Real-time UI
        await firebaseNotificationService.sendDataToUser(recipientUUID, {
            subType: 'FRIEND_REQUEST_RECEIVED',
            payload: JSON.stringify(existing)
        });

        return existing;
    }

    return await friendshipRepository.create({
      requesterUUID,
      recipientUUID,
      status: 'pending',
      message
    }).then(async f => {
        const requester = await userRepository.findByUUID(requesterUUID);
        const requesterName = (requester?.name && requester.name !== 'User') ? requester.name : 'A user';

        firebaseNotificationService.sendToUser(recipientUUID, 'friend_request', {
            title: 'New Friend Request',
            body: `${requesterName} sent you a friend request`
        }, { actorUUID: requesterUUID });

        // Trigger Data Message for Real-time UI
        await firebaseNotificationService.sendDataToUser(recipientUUID, {
            subType: 'FRIEND_REQUEST_RECEIVED',
            payload: JSON.stringify(f)
        });
        
        return f;
    });
  }

  async acceptRequest(userUUID, requesterUUID) {
    const friendship = await friendshipRepository.findPendingRequest(requesterUUID, userUUID);

    if (!friendship) {
      throw new Error('Friend request not found');
    }

    friendship.status = 'accepted';
    friendship.respondedAt = new Date();
    await friendshipRepository.save(friendship);

    // Notify requester
    const acceptor = await userRepository.findByUUID(userUUID);
    const acceptorName = (acceptor?.name && acceptor.name !== 'User') ? acceptor.name : 'A user';

    firebaseNotificationService.sendToUser(requesterUUID, 'friend_accepted', {
        title: 'Friend Request Accepted',
        body: `${acceptorName} accepted your friend request`
    }, { actorUUID: userUUID });

    // Trigger Data Message for Real-time UI
    await firebaseNotificationService.sendDataToUser(requesterUUID, {
        subType: 'FRIEND_ACCEPTED',
        payload: JSON.stringify(friendship)
    });

    return friendship;
  }

  async rejectRequest(userUUID, requesterUUID) {
     const friendship = await friendshipRepository.findPendingRequest(requesterUUID, userUUID);

    if (!friendship) {
      throw new Error('Friend request not found');
    }

    friendship.status = 'rejected';
    friendship.respondedAt = new Date();
    await friendshipRepository.save(friendship);

    return friendship;
  }

  async getFriends(userUUID) {
    const friendships = await friendshipRepository.findFriends(userUUID);

    const friendUUIDs = friendships.map(f => 
      f.requesterUUID === userUUID ? f.recipientUUID : f.requesterUUID
    );

    // Fetch user details
    const friends = await userRepository.findMany(friendUUIDs);
    return friends;
  }

  async getRequests(userUUID) {
     const requests = await friendshipRepository.findRequests(userUUID);

    // Populate sender details
    const senderUUIDs = requests.map(r => r.requesterUUID);
    const senders = await userRepository.findMany(senderUUIDs);

    const populatedRequests = requests.map(req => {
        const sender = senders.find(s => s.quizServerUUID === req.requesterUUID);
        return {
            ...req.toObject(),
            sender: sender ? {
                quizServerUUID: sender.quizServerUUID,
                name: sender.name,
                avatar: sender.avatar
            } : { quizServerUUID: req.requesterUUID, name: 'Unknown User' }
        };
    });

    return populatedRequests;
  }

  async blockUser(userUUID, targetUUID) {
    let friendship = await friendshipRepository.findExisting(userUUID, targetUUID);

    if (friendship) {
      friendship.status = 'blocked';
      friendship.requesterUUID = userUUID; // Blocker becomes requester
      friendship.recipientUUID = targetUUID;
      await friendshipRepository.save(friendship);
    } else {
      await friendshipRepository.create({
        requesterUUID: userUUID,
        recipientUUID: targetUUID,
        status: 'blocked'
      });
    }
    return { status: 'blocked' };
  }

  async unblockUser(userUUID, targetUUID) {
    // Specifically look for a block enacted by this user
    const friendship = await friendshipRepository.findBlocked(userUUID, targetUUID);

    if (friendship) {
      await friendshipRepository.delete(friendship._id);
    }
    return { status: 'unblocked' };
  }

  async getSuggestions(userUUID) {
      const friends = await this.getFriends(userUUID);
      const friendIds = friends.map(f => f.quizServerUUID);
      friendIds.push(userUUID);

      const suggestions = await userRepository.findSuggestions(friendIds);
      return suggestions;
  }
}

module.exports = new FriendService();

const groupRepository = require('../repositories/group.repository');
const groupMemberRepository = require('../repositories/group-member.repository');
const conversationRepository = require('../repositories/conversation.repository');
const userRepository = require('../repositories/user.repository');
const firebaseNotificationService = require('./firebase-notification.service');

class GroupService {
    
    async createGroup(creatorUUID, name, description, settings = {}, initialMemberUUIDs = []) {
        // 1. Combine creator and members into unique list
        const participants = Array.from(new Set([creatorUUID, ...initialMemberUUIDs]));

        // 2. Create Conversation with all participants
        const conversation = await conversationRepository.create({
            type: 'group',
            participantUUIDs: participants,
            initiatorUUID: creatorUUID,
            unreadCounts: participants.map(uuid => ({ userUUID: uuid, count: 0 }))
        });

        // 3. Create Group linked to conversation
        const group = await groupRepository.create({
            name,
            description,
            createdByUUID: creatorUUID,
            adminUUIDs: [creatorUUID],
            conversationId: conversation._id,
            settings
        });

        // 4. Create GroupMember records for everyone
        for (const uuid of participants) {
            await groupMemberRepository.create({
                groupId: group._id,
                userUUID: uuid,
                role: uuid === creatorUUID ? 'admin' : 'member',
                joinMethod: uuid === creatorUUID ? 'creator' : 'invited',
                invitedByUUID: uuid === creatorUUID ? null : creatorUUID
            });
        }

        // 5. Update conversation with group link
        await conversationRepository.update(conversation._id, { groupId: group._id }); 

        // 6. Notify initial members (except creator)
        if (initialMemberUUIDs.length > 0) {
            const creator = await userRepository.findByUUID(creatorUUID);
            const creatorName = creator?.name || 'Someone';

            for (const memberUUID of initialMemberUUIDs) {
                // Visible Notification
                firebaseNotificationService.sendToUser(memberUUID, 'group_invite', {
                    title: 'New Group',
                    body: `${creatorName} added you to the group "${name}"`
                }, { targetType: 'group', targetId: group._id, actorUUID: creatorUUID });

                // Real-time Data Sync
                firebaseNotificationService.sendDataToUser(memberUUID, {
                    subType: 'GROUP_CREATED',
                    payload: JSON.stringify(group)
                });
            }
        }

        // 7. Sync for creator
        await firebaseNotificationService.sendDataToUser(creatorUUID, {
            subType: 'GROUP_CREATED',
            payload: JSON.stringify(group)
        });

        return group;
    }

    async getGroups(userUUID) {
        // Find groups where user is a member
        const memberships = await groupMemberRepository.findByUser(userUUID);
        const groupIds = memberships.map(m => m.groupId);

        // Need findMany for groups
        // groupRepository.findMany(groupIds) - need to add this method or loop
        // Simple loop or direct find for now, usually repo has `findByIds`
        const groups = [];
        for (const id of groupIds) {
            const g = await groupRepository.findById(id);
            if(g) groups.push(g);
        }
        return groups;
    }

    async addMember(userUUID, groupId, newMemberUUID) {
       // Check permissions
       const member = await groupMemberRepository.findMember(groupId, userUUID);
       if (!member || (member.role === 'member' && !member.canInvite)) {
           throw new Error('Permission denied');
       }

       const group = await groupRepository.findById(groupId);
       
       // Add to GroupMember
       await groupMemberRepository.create({
           groupId,
           userUUID: newMemberUUID,
           role: 'member',
           joinMethod: 'invited',
           invitedByUUID: userUUID
       });

       // Update Conversation participants
       // Needs specific repo method or raw update if repo supports it
       // conversationRepository.addParticipant(group.conversationId, newMemberUUID);
       // We'll update via standard update for now
       await conversationRepository.update(group.conversationId, {
           $addToSet: { participantUUIDs: newMemberUUID },
           $push: { unreadCounts: { userUUID: newMemberUUID, count: 0 } }
       });

       // Notify new member
       const inviter = await userRepository.findByUUID(userUUID);
       const inviterName = (inviter?.name && inviter.name !== 'User') ? inviter.name : 'A user';

       firebaseNotificationService.sendToUser(newMemberUUID, 'group_invite', {
           title: 'Added to Group',
           body: `${inviterName} added you to ${group.name}`
       }, { targetType: 'group', targetId: groupId, actorUUID: userUUID });

       // Trigger Data Message for Real-time UI synchronization
       await firebaseNotificationService.sendDataToUser(newMemberUUID, {
           subType: 'GROUP_MEMBER_ADDED',
           payload: JSON.stringify({
               groupId,
               groupName: group.name,
               addedBy: userUUID
           })
       });

       return { status: 'added' };
    }

    async getGroupDetails(groupId) {
        const group = await groupRepository.findById(groupId);
        if (!group) throw new Error('Group not found');
        
        // Convert to object if mongoose doc
        const groupObj = group.toObject ? group.toObject() : group;
        
        const members = await groupMemberRepository.findByGroup(groupId);
        const memberUUIDs = members.map(m => m.userUUID);
        
        const userDetails = await userRepository.findMany(memberUUIDs);
            
        return { ...groupObj, members: userDetails };
    }
}

module.exports = new GroupService();

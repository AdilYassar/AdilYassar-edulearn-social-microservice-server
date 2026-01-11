const groupRepository = require('../repositories/group.repository');
const groupMemberRepository = require('../repositories/group-member.repository');
const conversationRepository = require('../repositories/conversation.repository');
const userRepository = require('../repositories/user.repository');

class GroupService {
    
    async createGroup(creatorUUID, name, description, settings = {}) {
        // Create Conversation first
        const conversation = await conversationRepository.create({
            type: 'group',
            participantUUIDs: [creatorUUID], // Add creator initially
            initiatorUUID: creatorUUID
        });

        // Create Group
        const group = await groupRepository.create({
            name,
            description,
            createdByUUID: creatorUUID,
            adminUUIDs: [creatorUUID],
            conversationId: conversation._id,
            settings
        });

        // Add Member Link
        await groupMemberRepository.create({
            groupId: group._id,
            userUUID: creatorUUID,
            role: 'admin',
            joinMethod: 'creator'
        });

        // Update conversation with group link (if schema supports it, repo update needed)
        // conversationRepository.update(conversation._id, { groupId: group._id }); 
        // Our Conversation model might not have groupId explicitly defined in previous steps, 
        // but if it does, we should update it.
        // Assuming loose schema or added field.

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

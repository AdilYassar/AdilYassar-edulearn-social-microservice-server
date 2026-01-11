const GroupMember = require('../models/GroupMember');

class GroupMemberRepository {
    async create(data) {
        return await GroupMember.create(data);
    }
    
    async findByUser(userUUID) {
        return await GroupMember.find({ userUUID, status: 'active' });
    }
    
    async findByGroup(groupId) {
        return await GroupMember.find({ groupId, status: 'active' });
    }
    
    async findMember(groupId, userUUID) {
        return await GroupMember.findOne({ groupId, userUUID, status: 'active' });
    }
}

module.exports = new GroupMemberRepository();

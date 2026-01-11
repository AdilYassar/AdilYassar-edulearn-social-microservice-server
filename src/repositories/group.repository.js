const Group = require('../models/Group');

class GroupRepository {
    async findById(id) {
        return await Group.findById(id);
    }
    
    async create(data) {
        return await Group.create(data);
    }
    
    async update(id, data) {
        return await Group.findByIdAndUpdate(id, data, { new: true });
    }
}
module.exports = new GroupRepository();

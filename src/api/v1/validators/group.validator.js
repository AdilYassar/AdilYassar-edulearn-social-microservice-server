const Joi = require('joi');

const schemas = {
  createGroup: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).allow(''),
    settings: Joi.object({
      maxMembers: Joi.number().integer().min(2).max(1000),
      joinApproval: Joi.boolean(),
      allowMemberInvites: Joi.boolean(),
      onlyAdminsCanPost: Joi.boolean()
    }).optional()
  }),
  addMember: Joi.object({
    memberUUID: Joi.string().uuid().required()
  })
};

module.exports = schemas;

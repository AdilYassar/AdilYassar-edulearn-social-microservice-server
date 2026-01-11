const Joi = require('joi');

const schemas = {
  sendRequest: Joi.object({
    recipientUUID: Joi.string().uuid().required(),
    message: Joi.string().max(500).allow('')
  }),
  acceptRequest: Joi.object({
    requesterUUID: Joi.string().uuid().required()
  }),
  rejectRequest: Joi.object({
    requesterUUID: Joi.string().uuid().required()
  })
};

module.exports = schemas;

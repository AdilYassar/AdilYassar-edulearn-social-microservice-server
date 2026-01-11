const Joi = require('joi');

const schemas = {
  sendMessage: Joi.object({
    recipientUUID: Joi.string().uuid().optional(), // For new conv creation
    content: Joi.alternatives().try(
        Joi.string().required(),
        Joi.object().required()
    ),
    type: Joi.string().valid('text', 'image', 'video', 'voice', 'document', 'location').default('text')
  }),
  createConversation: Joi.object({
      recipientUUID: Joi.string().uuid().required()
  })
};

module.exports = schemas;

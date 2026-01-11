const Joi = require('joi');

const schemas = {
  sendRequest: Joi.object({
    recipientUUID: Joi.string().uuid().required(),
    message: Joi.alternatives().try(
        Joi.string().required(),
        Joi.object().required()
    ),
    type: Joi.string().valid('text', 'image', 'video', 'voice', 'document').default('text')
  })
};

module.exports = schemas;

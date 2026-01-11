const Joi = require('joi');

const schemas = {
  createPost: Joi.object({
    type: Joi.string().valid('general', 'progress', 'question', 'achievement').default('general'),
    visibility: Joi.string().valid('public', 'friends', 'course_mates').default('public'),
    courseId: Joi.string().optional(),
    content: Joi.object({
        text: Joi.string().allow(''),
        media: Joi.array().items(Joi.object({
            mediaId: Joi.string().required(),
            type: Joi.string().valid('image', 'video', 'document').required(),
            thumbnail: Joi.string().optional()
        })),
        progress: Joi.object().optional(),
        question: Joi.object().optional()
    }).required()
  }),
  comment: Joi.object({
      content: Joi.string().required().max(1000)
  })
};

module.exports = schemas;

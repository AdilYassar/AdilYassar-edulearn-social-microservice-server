const Joi = require('joi');

const schemas = {
  createPost: Joi.object({
    type: Joi.string().valid('general', 'progress', 'question', 'achievement', 'announcement', 'news').default('general'),
    contentType: Joi.string().valid('text', 'image', 'video', 'poll').optional(),
    visibility: Joi.string().valid('public', 'friends', 'course_mates').default('public'),
    courseId: Joi.string().optional(),
    content: Joi.object({
        text: Joi.string().allow(''),
        url: Joi.string().uri().optional(),
        source: Joi.object().optional(),
        media: Joi.array().items(Joi.object({
            mediaId: Joi.string().required(),
            url: Joi.string().required(),
            type: Joi.string().valid('image', 'video').required(),
            fileName: Joi.string().optional(),
            fileSize: Joi.number().optional(),
            mimeType: Joi.string().optional(),
            width: Joi.number().optional(),
            height: Joi.number().optional(),
            aspectRatio: Joi.number().optional(),
            duration: Joi.number().optional(),
            thumbnail: Joi.string().optional(),
            thumbnailUrl: Joi.string().optional(),
            caption: Joi.string().optional()
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

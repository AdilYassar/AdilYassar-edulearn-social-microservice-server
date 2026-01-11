const Joi = require('joi');

const validate = (schema, property = 'body') => { 
  return (req, res, next) => { 
    const { error } = schema.validate(req[property]); 
    const valid = error == null; 
    
    if (valid) { 
      next(); 
    } else { 
      const { details } = error; 
      const message = details.map(i => i.message).join(',');
      
      res.status(400).json({ 
        status: 'error', 
        message: message 
      }); 
    } 
  };
};

module.exports = validate;

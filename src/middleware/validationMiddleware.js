const { ValidationError } = require('../utils/errors');

const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            // Validate body
            if (schema.body) {
                Object.entries(schema.body).forEach(([field, rules]) => {
                    const value = req.body[field];
                    
                    // Check required
                    if (rules.required && !value) {
                        throw new ValidationError(`${field} is required`);
                    }
                    
                    if (value) {
                        // Check type
                        if (rules.type && typeof value !== rules.type) {
                            throw new ValidationError(`${field} must be a ${rules.type}`);
                        }
                        
                        // Check min length
                        if (rules.min && value.length < rules.min) {
                            throw new ValidationError(`${field} must be at least ${rules.min} characters`);
                        }
                        
                        // Check max length
                        if (rules.max && value.length > rules.max) {
                            throw new ValidationError(`${field} must be at most ${rules.max} characters`);
                        }
                        
                        // Check pattern
                        if (rules.pattern && !rules.pattern.test(value)) {
                            throw new ValidationError(`${field} has invalid format`);
                        }
                        
                        // Check email format
                        if (rules.format === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                            throw new ValidationError(`${field} must be a valid email address`);
                        }
                    }
                });
            }
            
            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    validateRequest
}; 
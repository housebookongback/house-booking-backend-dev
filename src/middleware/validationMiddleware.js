const { ValidationError } = require('../utils/errors');

const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            // Validate body
            if (schema.body) {
                Object.entries(schema.body).forEach(([field, rules]) => {
                    const value = req.body[field];
                    
                    // Check required
                    if (rules.required && (value === undefined || value === null || value === '')) {
                        throw new ValidationError(`${field} is required`);
                    }
                    
                    if (value !== undefined && value !== null && value !== '') {
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
                        
                        // Check pattern - handle both string and RegExp objects
                        if (rules.pattern) {
                            let pattern = rules.pattern;
                            let isValid = false;
                            
                            try {
                                if (typeof pattern === 'string') {
                                    pattern = new RegExp(pattern);
                                }
                                isValid = pattern.test(value);
                            } catch (e) {
                                console.error(`Error testing pattern for ${field}:`, e);
                                isValid = false;
                            }
                            
                            if (!isValid) {
                                const message = rules.message || `${field} has invalid format`;
                                throw new ValidationError(message);
                            }
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
            // Handle validation errors specifically
            if (error instanceof ValidationError) {
                return res.status(400).json({ 
                    message: error.message,
                    status: 'error',
                    code: 'VALIDATION_ERROR'
                });
            }
            next(error);
        }
    };
};

module.exports = {
    validateRequest
}; 
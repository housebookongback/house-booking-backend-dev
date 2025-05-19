const express = require('express');
const router = express.Router();
const { validateRequest } = require('../middleware/validationMiddleware');
const authController = require('../controllers/authController');

// Validation schemas
const passwordSchema = {
    type: 'string',
    required: true,
    min: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    message: 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character'
};

const registerSchema = {
    body: {
        name: { type: 'string', required: true, min: 2, max: 100 },
        email: { type: 'string', required: true, format: 'email' },
        password: passwordSchema,
        phone: { type: 'string', required: false, pattern: /^\+?[\d\s-]{10,}$/ },
        language: { type: 'string', required: false, default: 'en' },
        currency: { type: 'string', required: false, default: 'USD' },
        timezone: { type: 'string', required: false, default: 'UTC' },
        country: { type: 'string', required: false },
        address: { type: 'object', required: false },
        notificationPreferences: { type: 'object', required: false },
        privacySettings: { type: 'object', required: false },
        dataConsent: { type: 'boolean', required: false, default: false }
    }
};

const loginSchema = {
    body: {
        email: { type: 'string', required: true, format: 'email' },
        password: { type: 'string', required: true }
    }
};

const forgotPasswordSchema = {
    body: {
        email: { type: 'string', required: true, format: 'email' }
    }
};

const resetPasswordSchema = {
    body: {
        token: { type: 'string', required: true },
        password: passwordSchema
    }
};

// Routes
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.get('/verify/:token', authController.verifyEmail);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);
router.post('/google', authController.googleAuth);
router.get('/google/url', authController.getGoogleAuthURL);
// Add this new route
router.get('/google/callback', authController.handleGoogleCallback);
router.post('/checking', authController.checkEmailAndPassword);

module.exports = router;

const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');  // Add this import at the top
const db = require('../models');
const { generateToken } = require('../middleware/jwtUtils');
const { ValidationError } = require('sequelize');

/**
 * Register a new user
 * @route POST /api/auth/register
 */
const register = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Check if user already exists
        const existingUser = await db.User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        const user = await db.User.create({
            name,
            email,
            passwordHash,
            phone,
            isVerified: true,
            status: 'active'
        });

        // Generate JWT token
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role
        });

        // Return user data (excluding sensitive information)
        res.status(201).json({
            message: 'Registration successful',
            data:{user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isVerified: user.isVerified
            },
            token}
        });
    } catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).json({
                message: 'Validation error',
                errors: error.errors.map(e => ({
                    field: e.path,
                    message: e.message
                }))
            });
        }
        console.error('Registration error:', error);
        res.status(500).json({ 
            message: 'Error registering user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Login user
 * @route POST /api/auth/login
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await db.User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user is active
        if (user.status !== 'active') {
            return res.status(403).json({ message: 'Account is not active' });
        }

        // Update last login
        await user.update({ lastLogin: new Date() });

        // Generate JWT token
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role
        });

        // Return user data
        res.json({
            message: 'Login successful',
           data: {user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isVerified: user.isVerified,
                role: user.role
            },
            token}
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
};

/**
 * Verify email
 * @route GET /api/auth/verify/:token
 */
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await db.User.findOne({
            where: {
                emailVerificationToken: token,
                emailVerifiedAt: null
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        await user.update({
            isVerified: true,
            emailVerifiedAt: new Date(),
            emailVerificationToken: null
        });

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: 'Error verifying email' });
    }
};

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await db.User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({data:{ message: 'User not found' }});
        }

        // Generate reset token
        const resetToken = await user.generatePasswordResetToken();

        // TODO: Send reset email
        // await sendPasswordResetEmail(user.email, resetToken);

        res.json({data:{ message: 'Password reset instructions sent to your email' }});
    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({data:{ message: 'Error processing password reset request' }});
    }
};

/**
 * Reset password
 * @route POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        const user = await db.User.findOne({
            where: {
                passwordResetToken: token,
                passwordResetExpires: { [Op.gt]: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({data:{ message: 'Invalid or expired reset token' }});
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Update password and clear reset token
        await user.update({
            passwordHash,
            passwordResetToken: null,
            passwordResetExpires: null
        });

        res.json({data:{ message: 'Password reset successful' }});
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({data:{ message: 'Error resetting password' }});
    }
};

const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
        throw new Error('Password must be at least 8 characters long');
    }
    if (!hasUpperCase || !hasLowerCase) {
        throw new Error('Password must contain both uppercase and lowercase letters');
    }
    if (!hasNumbers) {
        throw new Error('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
        throw new Error('Password must contain at least one special character');
    }
};


// Initialize Google OAuth client


// Google Sign In/Sign Up
/**
 * Handle Google OAuth authentication
 * @route POST /api/auth/google
 */


const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

/**
 * Get Google OAuth URL
 * @route GET /api/auth/google/url
 */
const getGoogleAuthURL = (req, res) => {
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        include_granted_scopes: true
    });

    res.json({data:{ url }});
};

/**
 * Handle Google OAuth callback
 * @route GET /api/auth/google/callback
 */
const handleGoogleCallback = async (req, res) => {
    try {
        const { code } = req.query;
        
        if (!code) {
            return res.redirect(`http://localhost:5173/login?error=${encodeURIComponent('Authorization code is required')}`);
        }

        // Exchange the authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get user info using the access token
        const ticket = await oauth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        
        // Check if user exists
        let user = await db.User.findOne({ where: { email: payload.email } });
        
        if (!user) {
            // Create new user if doesn't exist
            const randomPassword = crypto.randomBytes(32).toString('hex');
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(randomPassword, salt);
            
            user = await db.User.create({
                name: payload.name,
                email: payload.email,
                isVerified: true,
                emailVerifiedAt: new Date(),
                status: 'active',
                googleId: payload.sub,
                picture: payload.picture,
                passwordHash: passwordHash
            });
        }

        // Generate JWT token
        const jwtToken = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified
        });

        // Redirect to frontend with token
        return res.redirect(302, `http://localhost:5173/auth/callback?token=${encodeURIComponent(jwtToken)}`);

    } catch (error) {
        console.error('Google callback error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        
        // Redirect to login page with error
        return res.redirect(`http://localhost:5173/login?error=${encodeURIComponent('Failed to authenticate with Google')}`);
    }
};
const googleAuth = async (req, res) => {
    try {
        const { token } = req.body;
        
        const ticket = await oauth2Client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        
        // Check if user exists
        let user = await db.User.findOne({ where: { email: payload.email } });
        
        if (!user) {
            // Create new user if doesn't exist
            user = await db.User.create({
                name: payload.name,
                email: payload.email,
                isVerified: true,
                emailVerifiedAt: new Date(),
                status: 'active',
                googleId: payload.sub,
                picture: payload.picture
            });
        } else if (!user.googleId) {
            // Link Google account to existing user
            await user.update({
                googleId: payload.sub,
                picture: payload.picture
            });
        }

        // Generate JWT token
        const jwtToken = generateToken({
            id: user.id,
            email: user.email,
            role: user.role
        });

        res.json({
            token: jwtToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Google authentication error:', error);
        res.status(500).json({ message: 'Failed to authenticate with Google' });
    }
};
const checkEmailAndPassword = async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;

        // Check if email exists first
        const existingUser = await db.User.findOne({ where: { email } });
        
        // If email doesn't exist, return early
        if (!existingUser) {
            return res.json({data:{
                success: true,
                exists: false,
                message: 'Email available'
            }});
        }

        // Only check passwords if email exists and passwords are provided
        if (password && confirmPassword) {
            // Check if passwords match
            if (password !== confirmPassword) {
                return res.status(400).json({data:{
                    success: false,
                    message: 'Passwords do not match'
                }});
            }

            // Validate password strength
            try {
                validatePassword(password);
            } catch (error) {
                return res.status(400).json({data:{
                    success: false,
                    message: error.message
                }});
            }
        }

        // Return email exists response
        return res.json({data:{
            success: true,
            exists: true,
            message: 'Email already registered'
        }});

    } catch (error) {
        console.error('Email and password check error:', error);
        return res.status(500).json({data:{
            success: false,
            message: 'Error checking email and password'
        }});
    }
};
// Add handleGoogleCallback to module exports
module.exports = {
    googleAuth,
    register,
    login,
    verifyEmail,
    forgotPassword,
    resetPassword,
    getGoogleAuthURL,
    handleGoogleCallback ,
    checkEmailAndPassword
};


/**
 * Check email existence and validate password match
 * @route POST /api/auth/check-email-password
 */


// Add to module exports

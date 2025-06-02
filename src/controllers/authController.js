const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');  // Add this import at the top
const db = require('../models');
const { generateToken } = require('../middleware/jwtUtils');
const { ValidationError, Op } = require('sequelize');

// Initialize Google OAuth client with credentials from .env
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

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
            role: 'user' // Default role for new users
        });

        // Return user data (excluding sensitive information)
        return res.status(201).json({
            message: 'Registration successful',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    isVerified: user.isVerified,
                    role: 'user' // Default role for new users
                },
                token
            }
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
        return res.status(500).json({ 
            message: 'Error registering user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Login user
 * @route POST /api/auth/home
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user with their roles included
        const user = await db.User.findOne({
            where: { email },
            include: [
                {
                    model: db.Role,
                    as: 'roles',
                    attributes: ['id', 'name'],
                    through: { attributes: [] } // Don't include junction table attributes
                }
            ]
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user is active
        if (user.status === 'banned') {
            return res.status(403).json({ 
                message: 'This account has been banned',
                code: 'ACCOUNT_BANNED',
                reason: user.banReason || 'Contact support for more information'
            });
        }
        
        if (user.status !== 'active') {
            return res.status(403).json({ message: 'Account is not active' });
        }

        // Update last login
        await user.update({ lastLogin: new Date() });

        // Determine the primary role
        let primaryRole = 'user';  // Default role
        
        // Check roles array from the association
        if (user.roles && user.roles.length > 0) {
            // If user has multiple roles, prioritize in this order: admin > host > user
            const roleNames = user.roles.map(role => role.name);
            
            if (roleNames.includes('admin')) {
                primaryRole = 'admin';
            } else if (roleNames.includes('host')) {
                primaryRole = 'host';
            }
            
            console.log('User roles:', roleNames, 'Primary role:', primaryRole);
        }

        // Generate JWT token with the primary role
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: primaryRole
        });

        // Return user data with primary role
        return res.json({
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    isVerified: user.isVerified,
                    role: primaryRole
                },
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Error logging in' });
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
    try {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (password.length < minLength) {
            return false;
        }
        if (!hasUpperCase || !hasLowerCase) {
            return false;
        }
        if (!hasNumbers) {
            return false;
        }
        if (!hasSpecialChar) {
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error validating password:', error);
        return false;
    }
};


// Google Sign In/Sign Up
/**
 * Handle Google OAuth authentication
 * @route POST /api/auth/google
 */

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
            return res.redirect(`${process.env.appUrl}/home?error=${encodeURIComponent('Authorization code is required')}`);
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
        
        if (user) {
            // Check if user is banned
            if (user.status === 'banned') {
                return res.redirect(`${process.env.FRONTEND_URL || process.env.appUrl}/home?error=${encodeURIComponent('Your account has been banned. Please contact support for more information.')}`);
            }
            
            // Link Google account if not already linked
            if (!user.googleId) {
                await user.update({
                    googleId: payload.sub,
                    profilePicture: payload.picture
                });
            }
        } else {
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
                profilePicture: payload.picture,
                passwordHash: passwordHash
            });
        }

        // Generate JWT token
        const jwtToken = generateToken({
            id: user.id,
            email: user.email,
            role: 'user' // Default role for new users
        });

        // Redirect to frontend with token - using /auth/callback route
        return res.redirect(302, `${process.env.FRONTEND_URL || process.env.appUrl}/auth/callback?token=${encodeURIComponent(jwtToken)}`);

    } catch (error) {
        console.error('Google callback error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        
        // Redirect to login page with error
        return res.redirect(`${process.env.FRONTEND_URL || process.env.appUrl}/home?error=${encodeURIComponent('Failed to authenticate with Google')}`);
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
        
        if (user) {
            // Check if user is banned
            if (user.status === 'banned') {
                return res.status(403).json({ 
                    message: 'This account has been banned',
                    code: 'ACCOUNT_BANNED',
                    reason: user.banReason || 'Contact support for more information'
                });
            }
            
            // Link Google account if not already linked
            if (!user.googleId) {
                await user.update({
                    googleId: payload.sub,
                    profilePicture: payload.picture
                });
            }
        } else {
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
                profilePicture: payload.picture,
                passwordHash: passwordHash
            });
        }

        // Generate JWT token
        const jwtToken = generateToken({
            id: user.id,
            email: user.email,
            role: 'user' // Default role for new users
        });

        // Return user data with token using the same structure as login
        return res.json({
            message: 'Google authentication successful',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    isVerified: user.isVerified,
                    role: 'user'
                },
                token: jwtToken
            }
        });
    } catch (error) {
        console.error('Google authentication error:', error);
        return res.status(500).json({ message: 'Failed to authenticate with Google' });
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

/**
 * Get current user's details
 * @route GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
    try {
        // Get user ID from JWT token
        const userId = req.user.id;
        
        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        // Find user with their roles included
        const user = await db.User.findOne({
            where: { id: userId },
            include: [
                {
                    model: db.Role,
                    as: 'roles',
                    attributes: ['id', 'name'],
                    through: { attributes: [] } // Don't include junction table attributes
                }
            ],
            attributes: { exclude: ['passwordHash', 'passwordResetToken', 'passwordResetExpires', 'emailVerificationToken'] } // Exclude sensitive data
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Determine the primary role
        let primaryRole = 'user';  // Default role
        
        // Check roles array from the association
        if (user.roles && user.roles.length > 0) {
            // If user has multiple roles, prioritize in this order: admin > host > user
            const roleNames = user.roles.map(role => role.name);
            
            if (roleNames.includes('admin')) {
                primaryRole = 'admin';
            } else if (roleNames.includes('host')) {
                primaryRole = 'host';
            }
        }

        // Add primary role to user object
        const userData = user.toJSON();
        userData.role = primaryRole;

        return res.json({
            user: userData
        });
    } catch (error) {
        console.error('Error getting current user:', error);
        return res.status(500).json({ message: 'Error getting user information' });
    }
};

// Add Facebook authentication
/**
 * Handle Facebook OAuth authentication
 * @route POST /api/auth/facebook
 */
const facebookAuth = async (req, res) => {
    try {
        const { accessToken } = req.body;
        // Verify the access token with Facebook using your app credentials
        const appAccessTokenResponse = await fetch(
            `https://graph.facebook.com/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&grant_type=client_credentials`
        );
        const appAccessTokenData = await appAccessTokenResponse.json();
        // Verify the user access token
        const verifyTokenResponse = await fetch(
            `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appAccessTokenData.access_token}`
        );
        const verifyTokenData = await verifyTokenResponse.json();

        if (!verifyTokenData.data.is_valid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Facebook access token'
            });
        }

        // Get user data from Facebook
        const response = await fetch(
            `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
        );
        const data = await response.json();

        if (!data.email) {
            return res.status(400).json({
                success: false,
                message: 'Email not provided by Facebook'
            });
        }

        // Check if user exists
        let user = await db.User.findOne({ where: { email: data.email } });

        if (user) {
            // Check if user is banned
            if (user.status === 'banned') {
                return res.status(403).json({
                    success: false,
                    message: 'This account has been banned',
                    code: 'ACCOUNT_BANNED',
                    reason: user.banReason || 'Contact support for more information'
                });
            }
            
            // Link Facebook account if not already linked
            if (!user.facebookId) {
                await user.update({
                    facebookId: data.id,
                    picture: data.picture?.data?.url || user.picture
                });
            }
        } else {
            // Create new user if doesn't exist
            user = await db.User.create({
                name: data.name,
                email: data.email,
                isVerified: true,
                emailVerifiedAt: new Date(),
                status: 'active',
                facebookId: data.id,
                picture: data.picture?.data?.url
            });
        }

        // Generate JWT token
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role
        });

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    isVerified: user.isVerified,
                    role: user.role
                },
                token
            }
        });

    } catch (error) {
        console.error('Facebook authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to authenticate with Facebook',
            error: error.message
        });
    }
};

/**
 * Change user password
 * @route POST /api/auth/change-password
 */
const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        // Find the user
        const user = await db.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if current password is correct
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Password validation is now handled by middleware, no need to validate here

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Update password
        await user.update({ 
            passwordHash,
            passwordChangedAt: new Date()
        });

        return res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        return res.status(500).json({ message: 'Error changing password' });
    }
};

/**
 * Set up two-factor authentication
 * @route GET /api/auth/2fa/setup
 */
const setupTwoFactor = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find the user
        const user = await db.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if 2FA is already enabled
        if (user.twoFactorEnabled) {
            return res.status(400).json({ message: 'Two-factor authentication is already enabled' });
        }

        // Generate a secret key
        const secret = crypto.randomBytes(20).toString('hex');
        
        // Save the secret to the user record
        await user.update({ twoFactorSecret: secret });

        // Generate a QR code URL (for authenticator apps)
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/${encodeURIComponent(user.email)}?secret=${secret}&issuer=HouseBooking`;

        return res.json({ 
            message: 'Two-factor authentication setup initialized',
            qrCodeUrl,
            secret
        });
    } catch (error) {
        console.error('Error setting up 2FA:', error);
        return res.status(500).json({ message: 'Error setting up two-factor authentication' });
    }
};

/**
 * Verify two-factor authentication code
 * @route POST /api/auth/2fa/verify
 */
const verifyTwoFactor = async (req, res) => {
    try {
        const userId = req.user.id;
        const { code } = req.body;

        // Find the user
        const user = await db.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user has a 2FA secret
        if (!user.twoFactorSecret) {
            return res.status(400).json({ message: 'Two-factor authentication not set up' });
        }

        // Verify the code (simplified for this implementation)
        // In a real implementation, you'd use a library like 'speakeasy' to verify TOTP codes
        const isValid = code === '123456'; // This is a placeholder; use proper TOTP verification in production

        if (!isValid) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        // Enable 2FA for the user
        await user.update({ twoFactorEnabled: true });

        return res.json({ message: 'Two-factor authentication enabled successfully' });
    } catch (error) {
        console.error('Error verifying 2FA code:', error);
        return res.status(500).json({ message: 'Error verifying two-factor authentication' });
    }
};

/**
 * Toggle two-factor authentication
 * @route POST /api/auth/2fa/toggle
 */
const toggleTwoFactor = async (req, res) => {
    try {
        const userId = req.user.id;
        const { enabled } = req.body;

        // Find the user
        const user = await db.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If trying to enable, but no secret exists
        if (enabled && !user.twoFactorSecret) {
            return res.status(400).json({ message: 'Two-factor authentication not set up yet' });
        }

        // If disabling, remove the secret as well
        if (!enabled) {
            await user.update({ 
                twoFactorEnabled: false,
                twoFactorSecret: null
            });
            return res.json({ message: 'Two-factor authentication disabled successfully' });
        }

        // Otherwise just update the enabled status
        await user.update({ twoFactorEnabled: enabled });

        return res.json({ 
            message: enabled 
                ? 'Two-factor authentication enabled successfully' 
                : 'Two-factor authentication disabled successfully' 
        });
    } catch (error) {
        console.error('Error toggling 2FA:', error);
        return res.status(500).json({ message: 'Error updating two-factor authentication' });
    }
};

/**
 * Get security status
 * @route GET /api/auth/security/status
 */
const getSecurityStatus = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find the user
        const user = await db.User.findByPk(userId, {
            attributes: ['id', 'twoFactorEnabled', 'passwordChangedAt', 'lastLogin']
        });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json({
            twoFactorEnabled: user.twoFactorEnabled || false,
            passwordLastChanged: user.passwordChangedAt,
            lastLogin: user.lastLogin
        });
    } catch (error) {
        console.error('Error getting security status:', error);
        return res.status(500).json({ message: 'Error retrieving security status' });
    }
};

// Update module exports
module.exports = {
    googleAuth,
    register,
    login,
    verifyEmail,
    forgotPassword,
    resetPassword,
    getGoogleAuthURL,
    handleGoogleCallback,
    checkEmailAndPassword,
    getCurrentUser,
    facebookAuth,
    changePassword,
    setupTwoFactor,
    verifyTwoFactor,
    toggleTwoFactor,
    getSecurityStatus
};


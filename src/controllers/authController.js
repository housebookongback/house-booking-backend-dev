const bcrypt = require('bcryptjs');
const db = require('../models');
const { generateToken } = require('../middleware/jwtUtils');
const { ValidationError, Op } = require('sequelize');

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
            isVerified: false,
            status: 'active'
        });

        // Generate verification token
        const verificationToken = await user.generateVerificationToken();

        // TODO: Send verification email
        // await sendVerificationEmail(user.email, verificationToken);

        // Generate JWT token
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: 'user' // Default role for new users
        });

        // Return user data (excluding sensitive information)
        res.status(201).json({
            message: 'Registration successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isVerified: user.isVerified,
                role: 'user' // Default role for new users
            },
            token
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

        // Find user with their roles included
        const user = await db.User.findOne({
            where: { email },
            include: [
                {
                    model: db.Role,
                    as: 'roles',
                    attributes: ['name'],
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
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isVerified: user.isVerified,
                role: primaryRole
            },
            token
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
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate reset token
        const resetToken = await user.generatePasswordResetToken();

        // TODO: Send reset email
        // await sendPasswordResetEmail(user.email, resetToken);

        res.json({ message: 'Password reset instructions sent to your email' });
    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({ message: 'Error processing password reset request' });
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
            return res.status(400).json({ message: 'Invalid or expired reset token' });
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

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Error resetting password' });
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

module.exports = {
    register,
    login,
    verifyEmail,
    forgotPassword,
    resetPassword
}; 
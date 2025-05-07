const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * JWT UTILITIES
 * 
 * This file contains functions for JWT token generation and verification.
 * 
 * HOW TO USE:
 * 1. Import the functions: const { generateToken, verifyToken } = require('./jwtUtils');
 * 2. Use generateToken when user logs in
 * 3. Use verifyToken in auth middleware
 * 
 * REQUIRED ENV VARIABLE:
 * JWT_SECRET=your_secret_key_here
 */

/**
 * Generates a JWT token for a user
 * 
 * @param {Object} user - User object containing id, email, and role
 * @returns {String} JWT token
 * 
 * Example usage:
 * const token = generateToken({
 *   id: 1,
 *   email: 'user@example.com',
 *   role: 'user'
 * });
 */
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id,
            email: user.email,
            role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

/**
 * Verifies a JWT token
 * 
 * @param {String} token - JWT token to verify
 * @returns {Object|null} Decoded token data or null if invalid
 * 
 * Example usage:
 * const decoded = verifyToken(token);
 * if (decoded) {
 *   // Token is valid
 *   console.log(decoded.id);
 * }
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

module.exports = { generateToken, verifyToken }; 

/*
// When user logs in
const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role
});

// In your auth middleware
const decoded = verifyToken(token);
if (decoded) {
    // Token is valid, proceed
    req.user = decoded;
} else {
    // Token is invalid
    res.status(401).json({ message: 'Invalid token' });
}
*/
 
const bcrypt = require('bcrypt');

/**
 * PASSWORD UTILITIES
 * 
 * This file contains functions for password hashing and verification.
 * 
 * HOW TO USE:
 * 1. Import the functions: const { hashPassword, comparePassword } = require('./passwordUtils');
 * 2. Use hashPassword when creating/updating user passwords
 * 3. Use comparePassword when verifying login credentials
 */

/**
 * Hashes a password using bcrypt
 * 
 * @param {String} password - Plain text password to hash
 * @returns {String} Hashed password
 * 
 * Example usage:
 * const hashedPassword = await hashPassword('user123');
 * // Store hashedPassword in database
 */
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

/**
 * Compares a plain text password with a hashed password
 * 
 * @param {String} password - Plain text password to check
 * @param {String} hashedPassword - Hashed password from database
 * @returns {Boolean} True if passwords match, false otherwise
 * 
 * Example usage:
 * const isValid = await comparePassword('user123', storedHashedPassword);
 * if (isValid) {
 *   // Password is correct
 * }
 */
const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

module.exports = { hashPassword, comparePassword }; 


/**
 * // When creating a new user
const hashedPassword = await hashPassword('user123');
await User.create({
    email: 'user@example.com',
    password: hashedPassword
});

// When verifying login
const user = await User.findOne({ where: { email: 'user@example.com' } });
const isValid = await comparePassword('user123', user.password);
if (isValid) {
    // Generate JWT token and log user in
}
 */
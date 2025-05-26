const { verifyToken } = require('./jwtUtils');

/**
 * AUTHENTICATION MIDDLEWARE
 * 
 * This middleware verifies JWT tokens and authenticates users.
 * 
 * HOW TO USE:
 * 1. Import the middleware: const { authenticateJWT } = require('./middleware/authMiddleware');
 * 2. Add it to your routes: router.get('/protected', authenticateJWT, controller)
 * 
 * WHAT IT DOES:
 * 1. Checks for Authorization header with Bearer token
 * 2. Verifies the JWT token
 * 3. Adds the decoded user data to req.user
 * 
 * ERROR RESPONSES:
 * - 401: No token provided
 * - 401: Invalid token
 * 
 * ON SUCCESS:
 * - Adds user data to req.user
 * - Proceeds to next middleware/controller
 */
const authenticateJWT = (req, res, next) => {
    // Get token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    // Verify the token
    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    // Add user data to request
    req.user = decoded;
    next();
};

/**
 * AUTHORIZATION MIDDLEWARE
 * 
 * This middleware checks if a user has the required roles.
 * 
 * HOW TO USE:
 * 1. Import the middleware: const { authorize } = require('./middleware/authMiddleware');
 * 2. Add it after authenticateJWT: router.get('/admin', authenticateJWT, authorize(['admin']), controller)
 * 
 * WHAT IT DOES:
 * 1. Checks if user is authenticated
 * 2. Verifies if user has required roles
 * 
 * ERROR RESPONSES:
 * - 401: User not authenticated
 * - 403: Insufficient permissions
 */
const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        next();
    };
};

// For backward compatibility
const authenticate = authenticateJWT;

module.exports = { authenticateJWT, authenticate, authorize };
/**
 * // In your route file (e.g., adminRoutes.js)
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Example admin routes:
router.get('/admin/dashboard', 
    authenticate,           // First verify JWT token
    authorize(['admin']),   // Then check if user is admin
    adminController.dashboard
);

router.post('/admin/users', 
    authenticate,           // First verify JWT token
    authorize(['admin']),   // Then check if user is admin
    adminController.createUser
);

// You can also allow multiple roles
router.get('/admin/stats', 
    authenticate, 
    authorize(['admin', 'host']),  // Allow both admin and host
    adminController.getStats
);
 */
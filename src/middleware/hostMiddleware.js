const { User } = require('../models');

/**
 * HOST MIDDLEWARE GUIDE
 * 
 * HOW TO USE:
 * 1. Import the middleware: const verifyHost = require('./middleware/hostMiddleware');
 * 2. Add it to your routes after authenticate middleware:
 *    router.post('/houses', authenticate, verifyHost, houseController.createHouse)
 * 
 * WHAT IT CHECKS:
 * 1. User exists in database
 * 2. User is either a host or admin
 * 3. If user is a host, their account is verified
 * 
 * ERROR RESPONSES:
 * - 404: "User not found" - User doesn't exist in database
 * - 403: "Only hosts can perform this action" - User is not a host/admin
 * - 403: "Host account needs to be verified" - Host account not verified
 * - 500: Server error with details
 * 
 * ON SUCCESS:
 * - Adds host user object to req.host
 * - Proceeds to next middleware/controller
 * 
 * EXAMPLE USAGE:
 * // In your route file
 * router.post('/houses', authenticate, verifyHost, (req, res) => {
 *     // req.host is now available with the host's data
 *     const hostId = req.host.id;
 *     // ... rest of your code
 * });
 */

const verifyHost = async (req, res, next) => {
    try {
        // Get user from database using ID in JWT token
        const user = await User.findByPk(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user has host or admin role
        if (user.role !== 'host' && user.role !== 'admin') {
            return res.status(403).json({ message: 'Only hosts can perform this action' });
        }

        // For hosts, verify their account status
        if (!user.isVerified && user.role === 'host') {
            return res.status(403).json({ message: 'Host account needs to be verified' });
        }

        // Add host data to request for use in controller
        req.host = user;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error verifying host status', error: error.message });
    }
};

module.exports = verifyHost; 
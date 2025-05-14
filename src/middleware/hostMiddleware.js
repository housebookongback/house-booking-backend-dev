const { User, Role, UserRoles, HostProfile } = require('../models');

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
 * 2. User has host role through UserRoles
 * 3. If user is a host, their host profile is verified
 * 
 * ERROR RESPONSES:
 * - 404: "User not found" - User doesn't exist in database
 * - 403: "Only hosts can perform this action" - User is not a host/admin
 * - 403: "Host account needs to be verified" - Host profile not verified
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
        const user = await User.findByPk(req.user.id, {
            include: [{
                model: Role,
                as: 'roles',
                through: UserRoles
            }]
        });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user has host or admin role through UserRoles
        const hasHostRole = user.roles.some(role => role.name === 'host');
        const hasAdminRole = user.roles.some(role => role.name === 'admin');

        if (!hasHostRole && !hasAdminRole) {
            return res.status(403).json({ message: 'Only hosts can perform this action' });
        }

        // For hosts, verify their profile status
        if (hasHostRole) {
            const hostProfile = await HostProfile.findOne({
                where: { userId: user.id }
            });

            if (!hostProfile) {
                return res.status(403).json({ message: 'Host profile not found' });
            }

            if (hostProfile.verificationStatus !== 'verified') {
                return res.status(403).json({ 
                    message: 'Host account needs to be verified',
                    verificationStatus: hostProfile.verificationStatus
                });
            }
        }

        // Add host data to request for use in controller
        req.host = user;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error verifying host status', error: error.message });
    }
};

module.exports = verifyHost; 
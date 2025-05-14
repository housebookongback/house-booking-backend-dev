const { User, Role, UserRoles } = require('../models');

/**
 * ADMIN MIDDLEWARE GUIDE
 * 
 * HOW TO USE:
 * 1. Import the middleware: const { verifyAdmin } = require('./middleware/adminMiddleware');
 * 2. Add it to your routes after authenticate middleware:
 *    router.get('/admin/route', authenticate, verifyAdmin, adminController.someAction)
 * 
 * WHAT IT CHECKS:
 * 1. User exists in database
 * 2. User has admin role through UserRoles
 * 
 * ERROR RESPONSES:
 * - 404: "User not found" - User doesn't exist in database
 * - 403: "Only administrators can perform this action" - User is not an admin
 * - 500: Server error with details
 */

const verifyAdmin = async (req, res, next) => {
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

        // Check if user has admin role
        const hasAdminRole = user.roles.some(role => role.name === 'admin');

        if (!hasAdminRole) {
            return res.status(403).json({ message: 'Only administrators can perform this action' });
        }

        // Add admin data to request for use in controller
        req.admin = user;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error verifying admin status', error: error.message });
    }
};

module.exports = { verifyAdmin }; 
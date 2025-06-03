const { verifyToken } = require('../../middleware/jwtUtils');
const { User } = require('../../models');

/**
 * SOCKET.IO AUTHENTICATION MIDDLEWARE
 * 
 * This middleware verifies JWT tokens for Socket.IO connections.
 * Uses the same JWT verification as our HTTP routes.
 * 
 * HOW IT WORKS:
 * 1. Gets token from socket handshake auth or headers
 * 2. Uses existing verifyToken function from jwtUtils
 * 3. Fetches full user data from database
 * 4. Attaches user to socket.data for later use
 * 
 * ERROR HANDLING:
 * - Returns error if no token provided
 * - Returns error if token invalid
 * - Returns error if user not found
 */
async function authMiddleware(socket, next) {
    try {
        console.log('DEBUG  in auth middleware - Auth Middleware - Handshake:', {
            auth: socket.handshake.auth,
            headers: socket.handshake.headers
        });

        // Get token from handshake auth or headers
        const token = socket.handshake.auth.token || 
                     socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
            console.log('DEBUG - No token provided');
            return next(new Error('Authentication error: No token provided'));
        }

        // Use our existing JWT verification
        const decoded = verifyToken(token);
        if (!decoded) {
            console.log('DEBUG - Invalid token');
            return next(new Error('Authentication error: Invalid token'));
        }

        // Get full user data from database
        const user = await User.findByPk(decoded.id);
        if (!user) {
            console.log('DEBUG - User not found');
            return next(new Error('Authentication error: User not found'));
        }

        // Attach user to socket.data
        socket.data.user = user;
        console.log('DEBUG - User attached to socket:', {
            userId: user.id,
            hasUser: !!socket.data.user
        });
        
        next();
    } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
    }
}

module.exports = authMiddleware; 
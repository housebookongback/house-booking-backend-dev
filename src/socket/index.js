const { Server } = require('socket.io');
const messageSocket = require('./messageSocket');
const notificationSocket = require('./notificationSocket');
const authMiddleware = require('./middleware/auth');

function initializeSocket(server) {
    console.log('DEBUGggggggggggggggggggg - Initializing Socket.IO server');
    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            credentials: true
        },
        path: '/socket.io',
        pingTimeout: 60000,
        pingInterval: 25000,
        transports: ['websocket']
    });
    console.log('DEBUG - Socket.IO server initialized');

    // Apply authentication middleware
    io.use(authMiddleware);

    // Initialize namespaces
    const messageNamespace = io.of('/messages');
    const notificationNamespace = io.of('/notifications');

    // Apply authentication middleware to namespaces
    messageNamespace.use(authMiddleware);
    notificationNamespace.use(authMiddleware);

    // Shared active users registry
    const activeUsers = new Map();

    // Initialize socket handlers with shared registry
    messageSocket(messageNamespace, activeUsers);
    notificationSocket(notificationNamespace, activeUsers);

    // Handle connection errors
    io.on('error', (error) => {
        console.error('Socket.IO Error:', error);
    });

    return io;
}

module.exports = initializeSocket; 
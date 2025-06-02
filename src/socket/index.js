const { Server } = require('socket.io');
const messageSocket = require('./messageSocket');
const notificationSocket = require('./notificationSocket');
const authMiddleware = require('./middleware/auth');

// ─── 1) Move these into module scope so we can export them ──────────────────
let messageNamespace;                    // will hold io.of('/messages')
const activeUsers = new Map();           // <userId, socketId> mapping

function initializeSocket(server) {
    console.log('DEBUG - Initializing Socket.IO server');
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

    // Apply authentication middleware to all namespaces
    io.use(authMiddleware);

    // ─── 2) Assign to our outer-scope variable ─────────────────────────────────
    messageNamespace = io.of('/messages');
    const notificationNamespace = io.of('/notifications');

    // Apply auth middleware to each namespace as well
    messageNamespace.use(authMiddleware);
    notificationNamespace.use(authMiddleware);

    // ─── 3) Pass the shared activeUsers map into each socket handler ───────────
    messageSocket(messageNamespace, activeUsers);
    notificationSocket(notificationNamespace, activeUsers);

    io.on('error', (error) => {
        console.error('Socket.IO Error:', error);
    });

    return io;
}

// ─── 4) Export both initializeSocket and “accessors” for messageNamespace & activeUsers ─
module.exports = {
  initializeSocket,
  getMessageNamespace: () => messageNamespace,
  getActiveUsers:     () => activeUsers
};

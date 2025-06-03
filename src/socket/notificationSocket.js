const { Notification, User } = require('../models');

function notificationSocket(io, activeUsers) {
    io.on('connection', (socket) => {
        const userId = socket.data.user.id;
        
        // Add user to active users
        activeUsers.set(userId, socket.id);
        
        // Join user's notification room
        socket.join(`user:${userId}`);

        // Handle notification read status
        socket.on('mark_notification_read', async (data) => {
            try {
                const { notificationId } = data;
                
                await Notification.update(
                    { readAt: new Date() },
                    { where: { id: notificationId, userId } }
                );

                socket.emit('notification_read', { notificationId });

            } catch (error) {
                console.error('Error marking notification as read:', error);
                socket.emit('error', { message: 'Failed to mark notification as read' });
            }
        });

        // Handle mark all notifications as read
        socket.on('mark_all_read', async () => {
            try {
                await Notification.update(
                    { readAt: new Date() },
                    { where: { userId, readAt: null } }
                );

                socket.emit('all_notifications_read');

            } catch (error) {
                console.error('Error marking all notifications as read:', error);
                socket.emit('error', { message: 'Failed to mark all notifications as read' });
            }
        });

        // Handle notification preferences
        socket.on('update_notification_preferences', async (data) => {
            try {
                const { preferences } = data;
                
                await User.update(
                    { notificationPreferences: preferences },
                    { where: { id: userId } }
                );

                socket.emit('preferences_updated', { preferences });

            } catch (error) {
                console.error('Error updating notification preferences:', error);
                socket.emit('error', { message: 'Failed to update notification preferences' });
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            activeUsers.delete(userId);
        });
    });

    // Function to send notification to user
    const sendNotification = async (userId, notification) => {
        const userSocketId = activeUsers.get(userId);
        if (userSocketId) {
            io.to(userSocketId).emit('new_notification', notification);
        }
    };

    return {
        sendNotification
    };
}

module.exports = notificationSocket; 
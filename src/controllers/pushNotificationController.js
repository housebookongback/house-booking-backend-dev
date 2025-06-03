const pushNotificationService = require('../services/pushNotificationService');
const { User } = require('../models');

/**
 * Subscribe a user to push notifications
 * @route POST /api/push/subscribe
 */
exports.subscribe = async (req, res) => {
    try {
        const { subscription } = req.body;
        const userId = req.user.id;

        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ error: 'Invalid subscription object' });
        }

        const user = await pushNotificationService.subscribeUser(userId, subscription);
        res.json({ message: 'Successfully subscribed to push notifications', user });
    } catch (error) {
        console.error('Push subscription error:', error);
        res.status(500).json({ error: 'Failed to subscribe to push notifications' });
    }
};

/**
 * Unsubscribe a user from push notifications
 * @route POST /api/push/unsubscribe
 */
exports.unsubscribe = async (req, res) => {
    try {
        const { endpoint } = req.body;
        const userId = req.user.id;

        if (!endpoint) {
            return res.status(400).json({ error: 'Endpoint is required' });
        }

        const user = await pushNotificationService.unsubscribeUser(userId, endpoint);
        res.json({ message: 'Successfully unsubscribed from push notifications', user });
    } catch (error) {
        console.error('Push unsubscription error:', error);
        res.status(500).json({ error: 'Failed to unsubscribe from push notifications' });
    }
};

/**
 * Update user's notification preferences
 * @route PUT /api/push/preferences
 */
exports.updatePreferences = async (req, res) => {
    try {
        const { preferences } = req.body;
        const userId = req.user.id;

        if (!preferences) {
            return res.status(400).json({ error: 'Preferences are required' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Merge new preferences with existing ones
        const updatedPreferences = {
            ...user.notificationPreferences,
            ...preferences
        };

        await user.update({ notificationPreferences: updatedPreferences });
        res.json({ message: 'Successfully updated notification preferences', user });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({ error: 'Failed to update notification preferences' });
    }
};

/**
 * Test push notification
 * @route POST /api/push/test
 */
exports.testNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, message } = req.body;

        const notification = await pushNotificationService.sendNotification(userId, {
            title: title || 'Test Notification',
            message: message || 'This is a test notification',
            notificationType: 'systemUpdates',
            priority: 'low',
            metadata: {
                test: true
            }
        });

        res.json({ message: 'Test notification sent', notification });
    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({ error: 'Failed to send test notification' });
    }
}; 
const db = require('../models');

const notificationService = {
    /**
     * Create a notification for a user
     * @param {Object} options
     * @param {number} options.userId - The user to notify
     * @param {string} options.type - Notification type (info, success, warning, error)
     * @param {string} options.category - Notification category (booking, payment, review, message, system)
     * @param {string} options.title - Notification title
     * @param {string} options.message - Notification message
     * @param {Object} [options.metadata] - Additional metadata for the notification
     * @returns {Promise<Notification>}
     */
    createNotification: async ({ userId, type, category, title, message, metadata = {} }) => {
        try {
            return await db.Notification.create({
                userId,
                type,
                category,
                title,
                message,
                metadata
            });
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    },

    /**
     * Create a booking-related notification
     * @param {Object} options
     * @param {number} options.userId - The user to notify
     * @param {string} options.type - Notification type
     * @param {string} options.title - Notification title
     * @param {string} options.message - Notification message
     * @param {Object} [options.metadata] - Additional metadata
     * @returns {Promise<Notification>}
     */
    createBookingNotification: async ({ userId, type, title, message, metadata = {} }) => {
        return notificationService.createNotification({
            userId,
            type,
            category: 'booking',
            title,
            message,
            metadata
        });
    },

    /**
     * Create a payment-related notification
     * @param {Object} options
     * @param {number} options.userId - The user to notify
     * @param {string} options.type - Notification type
     * @param {string} options.title - Notification title
     * @param {string} options.message - Notification message
     * @param {Object} [options.metadata] - Additional metadata
     * @returns {Promise<Notification>}
     */
    createPaymentNotification: async ({ userId, type, title, message, metadata = {} }) => {
        return notificationService.createNotification({
            userId,
            type,
            category: 'payment',
            title,
            message,
            metadata
        });
    },

    /**
     * Create a review-related notification
     * @param {Object} options
     * @param {number} options.userId - The user to notify
     * @param {string} options.type - Notification type
     * @param {string} options.title - Notification title
     * @param {string} options.message - Notification message
     * @param {Object} [options.metadata] - Additional metadata
     * @returns {Promise<Notification>}
     */
    createReviewNotification: async ({ userId, type, title, message, metadata = {} }) => {
        return notificationService.createNotification({
            userId,
            type,
            category: 'review',
            title,
            message,
            metadata
        });
    },

    /**
     * Create a system notification
     * @param {Object} options
     * @param {number} options.userId - The user to notify
     * @param {string} options.type - Notification type
     * @param {string} options.title - Notification title
     * @param {string} options.message - Notification message
     * @param {Object} [options.metadata] - Additional metadata
     * @returns {Promise<Notification>}
     */
    createSystemNotification: async ({ userId, type, title, message, metadata = {} }) => {
        return notificationService.createNotification({
            userId,
            type,
            category: 'system',
            title,
            message,
            metadata
        });
    }
};

module.exports = notificationService; 
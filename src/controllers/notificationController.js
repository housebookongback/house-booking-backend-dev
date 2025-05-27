const db = require('../models');
const { Op } = require('sequelize');

const notificationController = {
    /**
     * Get all notifications for the current user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    getNotifications: async (req, res) => {
        try {
            const { page = 1, limit = 20, category, type, isRead } = req.query;
            const offset = (page - 1) * limit;

            const where = { userId: req.user.id };
            
            // Add filters if provided
            if (category) where.category = category;
            if (type) where.type = type;
            if (isRead !== undefined) where.isRead = isRead === 'true';

            const notifications = await db.Notification.findAndCountAll({
                where,
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            return res.json({
                success: true,
                data: {
                    notifications: notifications.rows,
                    pagination: {
                        total: notifications.count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        pages: Math.ceil(notifications.count / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch notifications'
            });
        }
    },

    /**
     * Get unread notifications count for the current user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    getUnreadCount: async (req, res) => {
        try {
            const count = await db.Notification.count({
                where: {
                    userId: req.user.id,
                    isRead: false
                }
            });

            return res.json({
                success: true,
                data: { count }
            });
        } catch (error) {
            console.error('Error fetching unread count:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch unread count'
            });
        }
    },

    /**
     * Mark a notification as read
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    markAsRead: async (req, res) => {
        try {
            const { notificationId } = req.params;

            const notification = await db.Notification.findOne({
                where: {
                    id: notificationId,
                    userId: req.user.id
                }
            });

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    error: 'Notification not found'
                });
            }

            await notification.markAsRead();

            return res.json({
                success: true,
                message: 'Notification marked as read'
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to mark notification as read'
            });
        }
    },

    /**
     * Mark all notifications as read for the current user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    markAllAsRead: async (req, res) => {
        try {
            await db.Notification.markAllAsRead(req.user.id);

            return res.json({
                success: true,
                message: 'All notifications marked as read'
            });
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to mark all notifications as read'
            });
        }
    },

    /**
     * Delete a notification
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    deleteNotification: async (req, res) => {
        try {
            const { notificationId } = req.params;

            const notification = await db.Notification.findOne({
                where: {
                    id: notificationId,
                    userId: req.user.id
                }
            });

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    error: 'Notification not found'
                });
            }

            await notification.destroy();

            return res.json({
                success: true,
                message: 'Notification deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting notification:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to delete notification'
            });
        }
    }
};

module.exports = notificationController; 
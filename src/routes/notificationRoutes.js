const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticate);

/**
 * @route GET /api/notifications
 * @desc Get all notifications for the current user
 * @access Private
 */
router.get('/', notificationController.getNotifications);

/**
 * @route GET /api/notifications/unread/count
 * @desc Get unread notifications count for the current user
 * @access Private
 */
router.get('/unread/count', notificationController.getUnreadCount);

/**
 * @route PATCH /api/notifications/:notificationId/read
 * @desc Mark a notification as read
 * @access Private
 */
router.patch('/:notificationId/read', notificationController.markAsRead);

/**
 * @route PATCH /api/notifications/read-all
 * @desc Mark all notifications as read for the current user
 * @access Private
 */
router.patch('/read-all', notificationController.markAllAsRead);

/**
 * @route DELETE /api/notifications/:notificationId
 * @desc Delete a notification
 * @access Private
 */
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router; 
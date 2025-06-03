const webpush = require('web-push');
const { Notification, User } = require('../models');
const { Op } = require('sequelize');

class PushNotificationService {
    constructor() {
        // Initialize web-push with VAPID keys
        webpush.setVapidDetails(
            'mailto:' + process.env.VAPID_SUBJECT,
            process.env.VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );
    }

    /**
     * Subscribe a user to push notifications
     * @param {number} userId - The user's ID
     * @param {Object} subscription - The push subscription object from the browser
     * @returns {Promise<Object>} The updated user with their subscription
     */
    async subscribeUser(userId, subscription) {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');

        // Get existing subscriptions or initialize empty array
        const existing = user.pushSubscriptions || [];
        
        // Only add if this endpoint doesn't already exist
        if (!existing.some(s => s.endpoint === subscription.endpoint)) {
            existing.push({
                endpoint: subscription.endpoint,
                keys: subscription.keys,
                createdAt: new Date()
            });
            await user.update({ pushSubscriptions: existing });
        }

        return user;
    }

    /**
     * Unsubscribe a user from push notifications
     * @param {number} userId - The user's ID
     * @param {string} endpoint - The subscription endpoint to remove
     * @returns {Promise<Object>} The updated user
     */
    async unsubscribeUser(userId, endpoint) {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');

        const pushSubscriptions = (user.pushSubscriptions || []).filter(
            sub => sub.endpoint !== endpoint
        );

        await user.update({ pushSubscriptions });
        return user;
    }

    /**
     * Check if a user has enabled notifications for a specific type
     * @param {number} userId - The user's ID
     * @param {string} type - The notification type to check
     * @returns {Promise<boolean>} Whether notifications are enabled
     */
    async hasNotificationEnabled(userId, type) {
        const user = await User.findByPk(userId);
        if (!user) return false;

        const preferences = user.notificationPreferences || {};
        // Check both the notification type and that push notifications are enabled
        return preferences.types?.[type] === true && preferences.channels?.push === true;
    }

    /**
     * Map business-level notification type to ENUM values
     * @param {string} notificationType - The business-level notification type
     * @param {Object} context - Additional context for mapping
     * @returns {Object} Mapped type and category
     */
    mapNotificationType(notificationType, context = {}) {
        const typeMap = {
            bookingUpdates: {
                type: context.status === 'cancelled' ? 'warning' : 'info',
                category: 'booking'
            },
            paymentUpdates: {
                type: context.status === 'failed' ? 'error' : 'info',
                category: 'payment'
            },
            reviewUpdates: {
                type: 'info',
                category: 'review'
            },
            messageUpdates: {
                type: 'info',
                category: 'message'
            },
            systemUpdates: {
                type: 'info',
                category: 'system'
            }
        };

        return typeMap[notificationType] || { type: 'info', category: 'system' };
    }

    /**
     * Send a push notification to a user
     * @param {number} userId - The user's ID
     * @param {Object} notification - The notification data
     * @returns {Promise<Object>} The created notification record
     */
    async sendNotification(userId, notification) {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');

        // Check if user has enabled this type of notification
        if (!await this.hasNotificationEnabled(userId, notification.notificationType)) {
            return null;
        }

        // Map business-level type to ENUM values
        const { type, category } = this.mapNotificationType(notification.notificationType, {
            status: notification.metadata?.status || notification.metadata?.paymentStatus
        });

        // Create notification record
        const notificationRecord = await Notification.create({
            userId,
            title: notification.title,
            message: notification.message,
            type,
            category,
            priority: notification.priority,
            metadata: notification.metadata,
            isRead: false
        });

        // Send push notification to all user's devices
        if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
            const payload = JSON.stringify({
                title: notification.title,
                message: notification.message,
                data: {
                    notificationId: notificationRecord.id,
                    ...notification.metadata
                }
            });

            // Send to all user's devices
            await Promise.all(
                user.pushSubscriptions.map(subscription =>
                    webpush.sendNotification(subscription, payload)
                        .catch(error => {
                            if (error.statusCode === 410) {
                                // Subscription is no longer valid, remove it
                                return this.unsubscribeUser(userId, subscription.endpoint);
                            }
                            // Log other errors but don't throw them
                            console.error('Push notification error:', {
                                userId,
                                endpoint: subscription.endpoint,
                                error: error.message,
                                statusCode: error.statusCode
                            });
                            return null;
                        })
                )
            );
        }

        return notificationRecord;
    }

    /**
     * Send notifications to all users with matching preferences
     * @param {Object} notification - The notification data
     * @param {Object} preferences - The notification preferences to match
     * @returns {Promise<Array>} Array of created notification records
     */
    async sendBulkNotification(notification, preferences) {
        const users = await User.findAll({
            where: {
                notificationPreferences: {
                    [Op.contains]: {
                        channels: { push: true },
                        types: preferences
                    }
                }
            }
        });

        return Promise.all(
            users.map(user => this.sendNotification(user.id, notification))
        );
    }

    /**
     * Send booking status notification to both guest and host
     * @param {Object} booking - The booking instance
     * @param {string} newStatus - The new booking status
     */
    async sendBookingStatusNotification(booking, newStatus) {
        const { guestId, hostId, listingId } = booking;
        const listing = await booking.getListing();
        
        // Notify guest
        await this.sendNotification(guestId, {
            title: `Booking ${newStatus}`,
            message: `Your booking at ${listing.title} is now ${newStatus}`,
            notificationType: 'bookingUpdates',
            priority: newStatus === 'cancelled' ? 'high' : 'medium',
            metadata: {
                bookingId: booking.id,
                listingId,
                status: newStatus,
                checkIn: booking.checkIn,
                checkOut: booking.checkOut
            }
        });

        // Notify host
        await this.sendNotification(hostId, {
            title: `Booking ${newStatus}`,
            message: `A booking at ${listing.title} is now ${newStatus}`,
            notificationType: 'bookingUpdates',
            priority: newStatus === 'cancelled' ? 'high' : 'medium',
            metadata: {
                bookingId: booking.id,
                listingId,
                status: newStatus,
                checkIn: booking.checkIn,
                checkOut: booking.checkOut
            }
        });
    }

    /**
     * Send payment status notification to both guest and host
     * @param {Object} booking - The booking instance
     * @param {string} newPaymentStatus - The new payment status
     */
    async sendPaymentStatusNotification(booking, newPaymentStatus) {
        const { guestId, hostId, listingId } = booking;
        const listing = await booking.getListing();
        
        // Notify guest
        await this.sendNotification(guestId, {
            title: `Payment ${newPaymentStatus}`,
            message: `Payment for your booking at ${listing.title} is ${newPaymentStatus}`,
            notificationType: 'paymentUpdates',
            priority: newPaymentStatus === 'failed' ? 'high' : 'medium',
            metadata: {
                bookingId: booking.id,
                listingId,
                paymentStatus: newPaymentStatus,
                totalPrice: booking.totalPrice
            }
        });

        // Notify host
        await this.sendNotification(hostId, {
            title: `Payment ${newPaymentStatus}`,
            message: `Payment for booking at ${listing.title} is ${newPaymentStatus}`,
            notificationType: 'paymentUpdates',
            priority: newPaymentStatus === 'failed' ? 'high' : 'medium',
            metadata: {
                bookingId: booking.id,
                listingId,
                paymentStatus: newPaymentStatus,
                totalPrice: booking.totalPrice
            }
        });
    }

    /**
     * Send check-in reminder notifications
     * @param {Object} booking - The booking instance
     */
    async sendBookingReminder(booking) {
        const { guestId, hostId, listingId } = booking;
        const listing = await booking.getListing();
        
        const daysUntilCheckIn = Math.ceil((new Date(booking.checkIn) - new Date()) / (1000 * 60 * 60 * 24));
        
        // Only send if check-in is within 24 hours
        if (daysUntilCheckIn <= 1) {
            // Notify guest
            await this.sendNotification(guestId, {
                title: 'Upcoming Check-in',
                message: `Your stay at ${listing.title} starts in ${daysUntilCheckIn} day${daysUntilCheckIn === 1 ? '' : 's'}`,
                notificationType: 'bookingUpdates',
                priority: 'medium',
                metadata: {
                    bookingId: booking.id,
                    listingId,
                    checkIn: booking.checkIn,
                    checkOut: booking.checkOut
                }
            });

            // Notify host
            await this.sendNotification(hostId, {
                title: 'Upcoming Guest Check-in',
                message: `A guest is checking in to ${listing.title} in ${daysUntilCheckIn} day${daysUntilCheckIn === 1 ? '' : 's'}`,
                notificationType: 'bookingUpdates',
                priority: 'medium',
                metadata: {
                    bookingId: booking.id,
                    listingId,
                    checkIn: booking.checkIn,
                    checkOut: booking.checkOut
                }
            });
        }
    }
}

module.exports = new PushNotificationService(); 
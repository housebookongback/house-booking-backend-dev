const { BookingRequest } = require('../models');
const logger = require('./logger');

/**
 * Expires old pending booking requests that have passed their expiration date
 * @returns {Promise<{expired: number}>} Number of requests expired
 */
async function expireOldBookingRequests() {
    try {
        const result = await BookingRequest.expireOldRequests();
        const expiredCount = result[0]; // Number of rows affected
        
        if (expiredCount > 0) {
            logger.info(`Expired ${expiredCount} old booking requests`);
        }
        
        return { expired: expiredCount };
    } catch (error) {
        logger.error('Failed to expire old booking requests:', error);
        throw error;
    }
}

/**
 * Runs all cleanup tasks
 * @returns {Promise<Object>} Results of all cleanup tasks
 */
async function runCleanupTasks() {
    const results = {
        bookingRequests: await expireOldBookingRequests()
    };
    
    logger.info('Completed cleanup tasks:', results);
    return results;
}

module.exports = {
    expireOldBookingRequests,
    runCleanupTasks
}; 
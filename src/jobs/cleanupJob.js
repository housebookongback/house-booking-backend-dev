const cron = require('node-cron');
const { runCleanupTasks } = require('../utils/cleanupTasks');
const logger = require('../utils/logger');

// Run cleanup tasks daily at 1 AM
const schedule = '0 1 * * *'; // 1 AM every day

function startCleanupJob() {
    cron.schedule(schedule, async () => {
        try {
            logger.info('Starting scheduled cleanup tasks...');
            await runCleanupTasks();
        } catch (error) {
            logger.error('Failed to run cleanup tasks:', error);
        }
    });
    
    logger.info(`Cleanup job scheduled to run at ${schedule}`);
}

module.exports = {
    startCleanupJob
}; 
const { faker } = require('@faker-js/faker');
const { SystemSetting, Document, Notification, Maintenance, Report } = require('../models');

async function seedSystem() {
  try {
    // Clean existing data
    await SystemSetting.destroy({ where: {} });
    await Maintenance.destroy({ where: {} });
    await Report.destroy({ where: {} });
    await Document.destroy({ where: {} });
    await Notification.destroy({ where: {} });

    // Create system settings
    await SystemSetting.bulkCreate([
      {
        key: 'site_name',
        value: 'House Booking',
        type: 'string',
        description: 'The name of the website',
        isPublic: true
      },
      {
        key: 'maintenance_mode',
        value: 'false',
        type: 'boolean',
        description: 'Whether the site is in maintenance mode',
        isPublic: true
      },
      {
        key: 'commission_rate',
        value: '0.10',
        type: 'number',
        description: 'Platform commission rate',
        isPublic: false
      }
    ]);

    // Create documents
    await Document.bulkCreate([
      {
        type: 'terms_of_service',
        title: 'Terms of Service',
        content: 'By using our service, you agree to these terms...',
        version: '1.0',
        isActive: true,
        publishedAt: new Date('2024-01-01')
      },
      {
        type: 'privacy_policy',
        title: 'Privacy Policy',
        content: 'We take your privacy seriously...',
        version: '1.0',
        isActive: true,
        publishedAt: new Date('2024-01-01')
      }
    ]);

    // Create notifications
    await Notification.bulkCreate([
      {
        userId: 1, // Admin user
        type: 'system',
        title: 'System Update',
        message: 'The system has been updated to version 1.1',
        isRead: false,
        priority: 'high'
      },
      {
        userId: 2, // Host user
        type: 'booking',
        title: 'New Booking Request',
        message: 'You have received a new booking request',
        isRead: false,
        priority: 'medium'
      }
    ]);

    // Create maintenance records
    await Maintenance.bulkCreate([
      {
        type: 'scheduled',
        title: 'Database Backup',
        description: 'Regular database backup',
        startTime: new Date('2024-03-01T02:00:00'),
        endTime: new Date('2024-03-01T03:00:00'),
        status: 'completed',
        impact: 'low'
      }
    ]);

    // Create reports
    await Report.bulkCreate([
      {
        type: 'monthly_revenue',
        title: 'March 2024 Revenue Report',
        content: 'Total revenue: $50,000',
        generatedAt: new Date('2024-03-31'),
        period: '2024-03',
        status: 'completed'
      }
    ]);

    console.log('✅ System models seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding system models:', error);
    throw error;
  }
}

module.exports = seedSystem;
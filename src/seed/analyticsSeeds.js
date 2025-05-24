const { faker } = require('@faker-js/faker');
const { ViewCount, ClickCount } = require('../models');
console.log(db.User,"hgvhzefbkzhfvk");

async function seedAnalytics() {
  try {
    // Create sample view counts
    await ViewCount.bulkCreate([
      {
        listingId: 1, // Assuming first listing ID is 1
        userId: 3, // Guest user
        viewDate: new Date('2024-03-01'),
        source: 'search_results',
        deviceType: 'desktop',
        sessionId: 'session_123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        referrer: 'https://example.com/search'
      },
      {
        listingId: 1,
        userId: null, // Anonymous user
        viewDate: new Date('2024-03-02'),
        source: 'direct',
        deviceType: 'mobile',
        sessionId: 'session_456',
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)',
        referrer: null
      }
    ]);

    // Create sample click counts
    await ClickCount.bulkCreate([
      {
        listingId: 1,
        userId: 3,
        clickDate: new Date('2024-03-01'),
        source: 'search_results',
        action: 'view_details',
        sessionId: 'session_123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        referrer: 'https://example.com/search'
      },
      {
        listingId: 1,
        userId: null,
        clickDate: new Date('2024-03-02'),
        source: 'direct',
        action: 'book_now',
        sessionId: 'session_456',
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)',
        referrer: null
      }
    ]);

    console.log('✅ Analytics models seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding analytics models:', error);
    throw error;
  }
}

module.exports = seedAnalytics;

// Exécution si appelé directement
// if (require.main === module) {
//   seedAnalytics();
// }


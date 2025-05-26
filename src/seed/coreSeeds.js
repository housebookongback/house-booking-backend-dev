const { User, Role, UserRoles } = require('../models');

async function seedCore() {
  try {
    // Create roles
    const roles = await Role.bulkCreate([
      { name: 'admin', description: 'Administrator' },
      { name: 'host', description: 'Property Host' },
      { name: 'guest', description: 'Property Guest' }
    ]);

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123', // This should be hashed in production
      isActive: true
    });

    // Create host user
    const host = await User.create({
      name: 'Host User',
      email: 'host@example.com',
      password: 'host123', // This should be hashed in production
      isActive: true
    });

    // Create guest user
    const guest = await User.create({
      name: 'Guest User',
      email: 'guest@example.com',
      password: 'guest123', // This should be hashed in production
      isActive: true
    });

    // Assign roles to users
    await UserRoles.bulkCreate([
      { userId: admin.id, roleId: roles[0].id }, // Admin role
      { userId: host.id, roleId: roles[1].id },  // Host role
      { userId: guest.id, roleId: roles[2].id }  // Guest role
    ]);

    console.log('✅ Core models seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding core models:', error);
    throw error;
  }
}

module.exports = seedCore;
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');
const sequelize  = require('../models').sequelize.models
console.log('Seeding core models...',sequelize);
console.log('Seeding core models...',sequelize);
async function seedCoreModels() {
  try {
    // await sequelize.Maintenance.destroy({ where: {} });
    // Clean existing data
    await sequelize.UserRoles.destroy({   where: {},});
    await sequelize.User.destroy({ where: {},      cascade: true,
      individualHooks: true });
    await sequelize.Role.destroy({ where: {} });

    // Seed Roles
    const roles = ['user', 'host', 'admin'].map(roleName => ({
      name: roleName,
      description: `${roleName.charAt(0).toUpperCase() + roleName.slice(1)} role`,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const createdRoles = await sequelize.Role.bulkCreate(roles);

    // Seed Users
    const users = Array.from({ length: 10 }).map(() => {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      return {
        name: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName }),
        passwordHash: bcrypt.hashSync('password123', 10),
        phone: faker.phone.number(),
        isVerified: faker.datatype.boolean(),
        emailVerifiedAt: faker.date.past(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    const createdUsers = await sequelize.User.bulkCreate(users);

    // Seed UserRoles
    const userRoles = createdUsers.map(user => ({
      userId: user.id,
      roleId: createdRoles[Math.floor(Math.random() * createdRoles.length)].id,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await sequelize.UserRoles.bulkCreate(userRoles);

    console.log('Core models seeded successfully');
  } catch (error) {
    console.error('Error seeding core models:', error);
    throw error;
  }
}
// seedCoreModels();
module.exports = seedCoreModels;
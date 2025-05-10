const { faker } = require('@faker-js/faker');
const sequelize = require('../models').sequelize.models;

async function seedHostModels() {
  try {
    // Nettoyage des données existantes
    await sequelize.HostProfile.destroy({ where: {} });

    // Récupération des utilisateurs existants avec le rôle 'host'
    const hostUsers = await sequelize.User.findAll({
      include: [{
        model: sequelize.Role,
        as: 'roles',  // Ajout de l'alias 'roles'
        where: { name: 'host' },
        through: sequelize.UserRoles
      }]
    });

    if (hostUsers.length === 0) {
      throw new Error('Aucun utilisateur avec le rôle "host" trouvé. Veuillez d\'abord exécuter le seed des utilisateurs.');
    }

    // Création des profils d'hôtes
    const hostProfiles = hostUsers.map(user => ({
      userId: user.id,
      displayName: `${user.name}'s Hosting`,
      bio: faker.lorem.paragraph(),
      phoneNumber: faker.phone.number(),
      emailVerified: true,
      verificationStatus: faker.helpers.arrayElement(['unverified', 'pending', 'verified', 'rejected']),
      identityVerified: faker.datatype.boolean(),
      superHost: faker.datatype.boolean(),
      responseRate: faker.number.float({ min: 0, max: 100 }),
      responseTime: faker.number.int({ min: 1, max: 24 }),
      acceptanceRate: faker.number.float({ min: 0, max: 100 }),
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await sequelize.HostProfile.bulkCreate(hostProfiles);

    console.log('Modèles d\'hôtes créés avec succès');
  } catch (error) {
    console.error('Erreur lors de la création des modèles d\'hôtes:', error);
    throw error;
  }
}
// seedHostModels();
module.exports = seedHostModels;
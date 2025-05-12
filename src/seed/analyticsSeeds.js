const { faker } = require('@faker-js/faker');
const db = require('../models');
console.log(db.User,"hgvhzefbkzhfvk");
async function seedAnalyticsModels() {
  try {
    // Nettoyage des données existantes
    await db.ClickCount.destroy({ where: {} });
    await db.ViewCount.destroy({ where: {} });

    // Récupération des IDs existants pour chaque type d'entité
    const listings = await db.Listing.findAll({ attributes: ['id'] });
    const users = await db.User.findAll({ attributes: ['id'] });
    const categories = await db.Category.findAll({ attributes: ['id'] });
    const locations = await db.Location.findAll({ attributes: ['id'] });

    // Création des combinaisons avec les IDs existants
    const combinations = [];
    
    if (listings.length) {
      listings.forEach(listing => {
        combinations.push({ type: 'listing', id: listing.id });
      });
    }
    
    if (users.length) {
      users.forEach(user => {
        combinations.push({ type: 'user', id: user.id });
      });
    }
    
    if (categories.length) {
      categories.forEach(category => {
        combinations.push({ type: 'category', id: category.id });
      });
    }
    
    if (locations.length) {
      locations.forEach(location => {
        combinations.push({ type: 'location', id: location.id });
      });
    }

    if (combinations.length === 0) {
      throw new Error('Aucune entité trouvée. Veuillez d\'abord exécuter les autres seeds.');
    }

    // Mélange aléatoire des combinaisons
    const shuffledCombinations = combinations
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

    // Création des ClickCounts
    const clickCounts = shuffledCombinations.slice(0, Math.min(20, combinations.length)).map(combo => ({
      entityType: combo.type,
      entityId: combo.id,
      count: faker.number.int({ min: 10, max: 1000 }),
      lastClickedAt: faker.date.recent(),
      source: faker.helpers.arrayElement(['search', 'recommendation', 'direct']),
      deviceType: faker.helpers.arrayElement(['desktop', 'mobile', 'tablet']),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Création des ViewCounts
    const viewCounts = shuffledCombinations.slice(0, Math.min(20, combinations.length)).map(combo => ({
      entityType: combo.type,
      entityId: combo.id,
      count: faker.number.int({ min: 10, max: 1000 }),
      lastViewedAt: faker.date.recent(),
      source: faker.helpers.arrayElement(['search', 'profile', 'recommendation']),
      deviceType: faker.helpers.arrayElement(['desktop', 'mobile', 'tablet']),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Insertion des données
    await db.ClickCount.bulkCreate(clickCounts);
    await db.ViewCount.bulkCreate(viewCounts);

    console.log('Modèles Analytics générés avec succès');
  } catch (error) {
    console.error('Erreur lors de la génération des modèles Analytics:', error);
    throw error;
  }
}
// seedAnalyticsModels()
module.exports = seedAnalyticsModels;

// Exécution si appelé directement
// if (require.main === module) {
//   seedAnalyticsModels();
// }


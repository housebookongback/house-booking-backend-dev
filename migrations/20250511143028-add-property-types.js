'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('PropertyTypes', [
      {
        name: 'house',
        description: 'A standalone residential building',
        icon: 'house-icon',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'apartment',
        description: 'A self-contained housing unit in a building',
        icon: 'apartment-icon',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'villa',
        description: 'A large, luxurious house, often with a garden',
        icon: 'villa-icon',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'condo',
        description: 'A privately owned unit in a multi-unit building',
        icon: 'condo-icon',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'townhouse',
        description: 'A house that shares walls with adjacent properties',
        icon: 'townhouse-icon',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'cabin',
        description: 'A small, simple house made of wood',
        icon: 'cabin-icon',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'cottage',
        description: 'A small house, typically in a rural area',
        icon: 'cottage-icon',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'bungalow',
        description: 'A low house with a broad front porch',
        icon: 'bungalow-icon',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'studio',
        description: 'A small apartment with a combined living and sleeping area',
        icon: 'studio-icon',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'loft',
        description: 'A large, open space converted for residential use',
        icon: 'loft-icon',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'guesthouse',
        description: 'A separate house for guests',
        icon: 'guesthouse-icon',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'farmhouse',
        description: 'A house on a farm',
        icon: 'farmhouse-icon',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'castle',
        description: 'A large, fortified building',
        icon: 'castle-icon',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'treehouse',
        description: 'A structure built in a tree',
        icon: 'treehouse-icon',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'yurt',
        description: 'A portable, round tent',
        icon: 'yurt-icon',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'tent',
        description: 'A portable shelter made of cloth',
        icon: 'tent-icon',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'boat',
        description: 'A watercraft used for accommodation',
        icon: 'boat-icon',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'other',
        description: 'Other types of accommodation',
        icon: 'other-icon',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('PropertyTypes', null, {});
  }
};

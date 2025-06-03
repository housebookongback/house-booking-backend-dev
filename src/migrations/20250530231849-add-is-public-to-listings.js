'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Listings', 'isPublic', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Controls if the listing is visible to guests. When false, only the host can see it.'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Listings', 'isPublic');
  }
};

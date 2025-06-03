module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'banReason', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'banReason');
  }
}; 
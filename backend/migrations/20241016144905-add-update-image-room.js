'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Rooms', 'imagePath', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    const tableDefinition = await queryInterface.describeTable('Rooms');

    if (tableDefinition.imagePath) {
      await queryInterface.removeColumn('Rooms', 'imagePath');
    }
  },
};

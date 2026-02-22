'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Events', 'googleEventId', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Events', 'paymentMethod', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Events', 'googleEventId');
    await queryInterface.removeColumn('Events', 'paymentMethod');
  },
};

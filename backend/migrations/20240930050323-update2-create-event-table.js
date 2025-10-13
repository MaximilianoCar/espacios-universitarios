'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn(
      'Events',
      'reservatioFrom',
      'reservationFrom'
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn(
      'Events',
      'reservationFrom',
      'reservatioFrom'
    );
  },
};

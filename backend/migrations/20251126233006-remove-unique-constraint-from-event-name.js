'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Events', 'Events_name_key');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addConstraint('Events', {
      fields: ['name'],
      type: 'unique',
      name: 'Events_name_key',
    });
  },
};

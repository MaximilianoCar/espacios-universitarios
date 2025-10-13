'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Rooms', 'name', {
      type: Sequelize.STRING,
      allowNull: false, // Ahora este campo puede ser nulo
    });
    await queryInterface.changeColumn('Rooms', 'capacity', {
      type: Sequelize.INTEGER,
      allowNull: false, // Ahora este campo puede ser nulo
    });
    await queryInterface.changeColumn('Rooms', 'location', {
      type: Sequelize.STRING,
      allowNull: false, // Ahora este campo puede ser nulo
    });
    await queryInterface.changeColumn('Rooms', 'staffowner', {
      type: Sequelize.STRING,
      allowNull: false, // Ahora este campo puede ser nulo
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};

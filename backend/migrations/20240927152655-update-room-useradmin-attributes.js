'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Rooms', 'name', {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
    });

    await queryInterface.addColumn('Users', 'ci', {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true, // Puedes ajustar esto según tus necesidades
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Modificar el tipo ENUM existente para agregar 'externalvisitor'
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Users_role" 
      ADD VALUE IF NOT EXISTS 'externalvisitor';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Not possible to remove enum value directly in PostgreSQL');
  },
};

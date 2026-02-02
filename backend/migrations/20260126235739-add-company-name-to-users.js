'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'companyName', {
      type: Sequelize.STRING,
      allowNull: true,
      comment:
        'Nombre de la empresa/organización que representa (solo si isCompanyRepresentative es true)',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'companyName');
  },
};

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'isExternal', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indica si el usuario es externo a la universidad',
    });

    await queryInterface.addColumn('Users', 'isCompanyRepresentative', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indica si el usuario viene en representación de una empresa',
    });

    await queryInterface.addColumn('Users', 'companyRif', {
      type: Sequelize.STRING,
      allowNull: true,
      comment:
        'RIF de la empresa que representa (solo si isCompanyRepresentative es true)',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'isExternal');
    await queryInterface.removeColumn('Users', 'isCompanyRepresentative');
    await queryInterface.removeColumn('Users', 'companyRif');
  },
};

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CoordinatorDependencies', {
      UserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true,
      },
      DependencyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Dependencies',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // Añadir índice único compuesto
    await queryInterface.addIndex('CoordinatorDependencies', {
      fields: ['UserId', 'DependencyId'],
      unique: true,
      name: 'coordinator_dependencies_unique',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('CoordinatorDependencies');
  },
};

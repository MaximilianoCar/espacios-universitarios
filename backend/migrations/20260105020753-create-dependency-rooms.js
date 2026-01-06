'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('DependencyRooms', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
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
      },
      RoomId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Rooms',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
    await queryInterface.addIndex('DependencyRooms', {
      fields: ['DependencyId', 'RoomId'],
      unique: true,
      name: 'dependency_rooms_unique',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('DependencyRooms');
  },
};

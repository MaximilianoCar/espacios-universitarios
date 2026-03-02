'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Primero, eliminar la tabla CoordinatorRooms
    await queryInterface.dropTable('CoordinatorRooms');
  },

  down: async (queryInterface, Sequelize) => {
    // Para revertir, recrear la tabla CoordinatorRooms
    await queryInterface.createTable('CoordinatorRooms', {
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
      RoomId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Rooms',
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
    await queryInterface.addIndex('CoordinatorRooms', {
      fields: ['UserId', 'RoomId'],
      unique: true,
      name: 'coordinator_rooms_unique',
    });
  },
};

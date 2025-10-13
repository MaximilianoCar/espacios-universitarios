'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Events', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      comments: {
        type: Sequelize.TEXT,
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      cost: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      contact: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'denied'),
        allowNull: false,
      },
      eventFrom: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      eventTo: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      reservationFrom: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      reservationTo: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      programPath: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      agreementPath: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users', // Nombre de la tabla de usuarios
          key: 'id',
        },
        onDelete: 'CASCADE', // Si el usuario se elimina, elimina el evento
      },
      roomId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Rooms', // Nombre de la tabla de rooms
          key: 'id',
        },
        onDelete: 'SET NULL', // Si la sala se elimina, no elimina el evento
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Events');
  },
};

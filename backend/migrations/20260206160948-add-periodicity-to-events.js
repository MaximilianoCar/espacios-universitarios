'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Modificar la tabla Events usando nombres en camelCase
    await queryInterface.changeColumn('Events', 'eventFrom', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.changeColumn('Events', 'eventTo', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.changeColumn('Events', 'reservationFrom', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.changeColumn('Events', 'reservationTo', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // 2. Crear la tabla EventSchedules
    // Nota: Aquí puedes elegir camelCase para ser consistente con tu tabla Events
    await queryInterface.createTable('EventSchedules', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      eventId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Events',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
      dateOnly: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      startTime: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      endTime: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      dayOfWeek: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('EventSchedules');

    await queryInterface.changeColumn('Events', 'eventFrom', {
      type: Sequelize.DATE,
      allowNull: false,
    });
    await queryInterface.changeColumn('Events', 'eventTo', {
      type: Sequelize.DATE,
      allowNull: false,
    });
    await queryInterface.changeColumn('Events', 'reservationFrom', {
      type: Sequelize.DATE,
      allowNull: false,
    });
    await queryInterface.changeColumn('Events', 'reservationTo', {
      type: Sequelize.DATE,
      allowNull: false,
    });
  },
};

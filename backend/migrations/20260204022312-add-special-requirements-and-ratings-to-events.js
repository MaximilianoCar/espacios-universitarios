'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Events', 'special_requirements', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment:
        'Requerimientos especiales como logística, protocolo, vigilancia, estacionamiento, etc.',
    });

    await queryInterface.addColumn('Events', 'space_condition_rating', {
      type: Sequelize.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5,
      },
      comment: 'Calificación de condiciones del espacio (1-5)',
    });

    await queryInterface.addColumn('Events', 'staff_treatment_rating', {
      type: Sequelize.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5,
      },
      comment: 'Calificación de trato del personal (1-5)',
    });

    await queryInterface.addColumn('Events', 'reservation_process_rating', {
      type: Sequelize.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5,
      },
      comment: 'Calificación de proceso de reserva (1-5)',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Events', 'special_requirements');
    await queryInterface.removeColumn('Events', 'space_condition_rating');
    await queryInterface.removeColumn('Events', 'staff_treatment_rating');
    await queryInterface.removeColumn('Events', 'reservation_process_rating');
  },
};

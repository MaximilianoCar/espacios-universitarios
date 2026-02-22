'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('EventSchedules', 'googleEventId', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'ID del evento en Google Calendar por schedule',
      field: 'google_event_id',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('EventSchedules', 'googleEventId');
  },
};

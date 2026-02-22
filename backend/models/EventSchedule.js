'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EventSchedule extends Model {
    static associate(models) {
      EventSchedule.belongsTo(models.Event, {
        foreignKey: 'eventId',
        as: 'event',
      });
    }
  }
  EventSchedule.init(
    {
      eventId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // Campos completos para lógica de sistema
      eventFrom: { type: DataTypes.DATE, allowNull: false },
      eventTo: { type: DataTypes.DATE, allowNull: false },
      reservationFrom: { type: DataTypes.DATE, allowNull: false },
      reservationTo: { type: DataTypes.DATE, allowNull: false },

      // Campos de utilidad para queries rápidas y periodicidad
      dateOnly: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: 'Solo fecha (2024-09-02)',
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: false,
        comment: 'Solo la hora de inicio (09:00:00)',
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: false,
        comment: 'Solo la hora de fin (11:00:00)',
      },
      dayOfWeek: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 0, max: 6 },
        comment: '0=Domingo, 1=Lunes, etc.',
      },
      googleEventId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'ID del evento en Google Calendar (por schedule)',
      },
    },
    {
      sequelize,
      modelName: 'EventSchedule',
      //underscored: true,
    }
  );
  return EventSchedule;
};

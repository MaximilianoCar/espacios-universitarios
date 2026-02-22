'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Event extends Model {
    static get STATUS() {
      return {
        PENDING: 'pending',
        APPROVED: 'approved',
        DENIED: 'denied',
      };
    }
    static associate(models) {
      // Relación "muchos a uno" con User
      Event.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE',
      });

      // Relación "muchos a uno" con Room
      Event.belongsTo(models.Room, {
        foreignKey: 'roomId',
        as: 'room',
        onDelete: 'SET NULL',
      });
      // Un evento tiene muchas ocurrencias/horarios
      Event.hasMany(models.EventSchedule, {
        foreignKey: 'eventId',
        as: 'schedules',
        onDelete: 'CASCADE',
      });
    }
  }
  Event.init(
    {
      name: { type: DataTypes.STRING, allowNull: false },
      description: DataTypes.TEXT,
      comments: DataTypes.TEXT,
      capacity: { type: DataTypes.INTEGER, allowNull: false },
      cost: { type: DataTypes.STRING, allowNull: false },
      contact: { type: DataTypes.STRING, allowNull: false },
      status: {
        type: DataTypes.ENUM(
          Event.STATUS.PENDING,
          Event.STATUS.APPROVED,
          Event.STATUS.DENIED
        ),
        allowNull: false,
      },
      eventFrom: { type: DataTypes.DATE, allowNull: true },
      eventTo: { type: DataTypes.DATE, allowNull: true },
      reservationFrom: { type: DataTypes.DATE, allowNull: true },
      reservationTo: { type: DataTypes.DATE, allowNull: true },
      programPath: DataTypes.STRING,
      agreementPath: DataTypes.STRING,
      googleEventId: DataTypes.STRING,
      paymentMethod: DataTypes.STRING,
      imagePath: DataTypes.STRING,
      bannerPath: DataTypes.STRING,
      specialRequirements: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment:
          'Requerimientos especiales como logística, protocolo, vigilancia, estacionamiento, etc.',
        field: 'special_requirements',
      },
      spaceConditionRating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5,
        },
        comment: 'Calificación de condiciones del espacio (1-5)',
        field: 'space_condition_rating',
      },
      staffTreatmentRating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5,
        },
        comment: 'Calificación de trato del personal (1-5)',
        field: 'staff_treatment_rating',
      },
      reservationProcessRating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5,
        },
        comment: 'Calificación de proceso de reserva (1-5)',
        field: 'reservation_process_rating',
      },
    },
    {
      sequelize,
      modelName: 'Event',
      //underscored: true,
    }
  );
  return Event;
};

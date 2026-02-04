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

    static get RATING() {
      return {
        MIN: 1,
        MAX: 5,
      };
    }

    static associate(models) {
      Event.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE',
      });

      Event.belongsTo(models.Room, {
        foreignKey: 'roomId',
        as: 'room',
        onDelete: 'SET NULL',
      });
    }
  }
  Event.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: DataTypes.TEXT,
      comments: DataTypes.TEXT,
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      cost: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      contact: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          Event.STATUS.PENDING,
          Event.STATUS.APPROVED,
          Event.STATUS.DENIED
        ),
        allowNull: false,
      },
      eventFrom: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      eventTo: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      reservationFrom: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      reservationTo: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      programPath: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      agreementPath: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      imagePath: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bannerPath: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      specialRequirements: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'special_requirements',
        comment:
          'Requerimientos especiales como logística, protocolo, vigilancia, estacionamiento, etc.',
      },
      spaceConditionRating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'space_condition_rating',
        validate: {
          min: Event.RATING.MIN,
          max: Event.RATING.MAX,
        },
        comment: 'Calificación de condiciones del espacio (1-5)',
      },
      staffTreatmentRating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'staff_treatment_rating',
        validate: {
          min: Event.RATING.MIN,
          max: Event.RATING.MAX,
        },
        comment: 'Calificación de trato del personal (1-5)',
      },
      reservationProcessRating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'reservation_process_rating',
        validate: {
          min: Event.RATING.MIN,
          max: Event.RATING.MAX,
        },
        comment: 'Calificación de proceso de reserva (1-5)',
      },
    },
    {
      sequelize,
      modelName: 'Event',
      underscored: true,
    }
  );
  return Event;
};

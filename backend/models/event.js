'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Event extends Model {
    // Agregamos propiedades estáticas para el status
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
        foreignKey: 'userId', // Llave foránea en Event
        as: 'user', // Alias para la relación
        onDelete: 'CASCADE', // Si el usuario se elimina, elimina el evento
      });

      // Relación "muchos a uno" con Room
      Event.belongsTo(models.Room, {
        foreignKey: 'roomId', // Llave foránea en Event
        as: 'room', // Alias para la relación
        onDelete: 'SET NULL', // Si la sala se elimina, no elimina el evento pero establece roomId en null
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
      name: { type: DataTypes.STRING, unique: true, allowNull: false },
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
      imagePath: DataTypes.STRING,
      bannerPath: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Event',
      underscored: true,
    }
  );
  return Event;
};

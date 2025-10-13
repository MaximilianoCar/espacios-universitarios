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
    }
  }
  Event.init(
    {
      name: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false, // Este campo es obligatorio
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
        ), // Solo permite los valores 'pending','approved',"denied"
        allowNull: false, // Campo obligatorio
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
        type: DataTypes.STRING, // Ruta del archivo del programa
        allowNull: true,
      },
      agreementPath: {
        type: DataTypes.STRING, // Ruta del archivo del contrato
        allowNull: true,
      },
      imagePath: {
        type: DataTypes.STRING,
        allowNull: true, // Puede ser nulo si no se sube imagen
      },
    },
    {
      sequelize,
      modelName: 'Event',
    }
  );
  return Event;
};

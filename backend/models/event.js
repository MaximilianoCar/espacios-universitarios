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
    },
    {
      sequelize,
      modelName: 'Event',
    }
  );
  return Event;
};

'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Invitation extends Model {
    static associate(models) {
      Invitation.belongsTo(models.Event, {
        foreignKey: 'eventId',
        as: 'event',
      });
    }
  }
  Invitation.init(
    {
      eventId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      lastSentAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Invitation',
      tableName: 'Invitations',
      timestamps: false,
    }
  );
  return Invitation;
};

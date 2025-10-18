'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CoordinatorRooms extends Model {
    static associate(models) {
      CoordinatorRooms.belongsTo(models.Room, {
        foreignKey: 'RoomId',
        as: 'room',
      });
      CoordinatorRooms.belongsTo(models.User, {
        foreignKey: 'UserId',
        as: 'user',
      });
    }
  }

  CoordinatorRooms.init(
    {
      UserId: {
        type: DataTypes.INTEGER,
        unique: 'compositeIndex',
        allowNull: false,
      },
      RoomId: {
        type: DataTypes.INTEGER,
        unique: 'compositeIndex',
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'CoordinatorRooms',
      id: false,
      primaryKeys: ['UserId', 'RoomId'],
      timestamps: false,
    }
  );
  return CoordinatorRooms;
};

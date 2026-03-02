'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DependencyRooms extends Model {
    static associate(models) {
      DependencyRooms.belongsTo(models.Dependency, {
        foreignKey: 'DependencyId',
        as: 'dependency',
      });
      DependencyRooms.belongsTo(models.Room, {
        foreignKey: 'RoomId',
        as: 'room',
      });
    }
  }

  DependencyRooms.init(
    {
      DependencyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      RoomId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'DependencyRooms',
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ['DependencyId', 'RoomId'],
        },
      ],
    }
  );
  return DependencyRooms;
};

'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Room extends Model {
    static associate(models) {
      Room.hasMany(models.Event, {
        foreignKey: 'roomId',
        as: 'events',
      });

      // relación con Dependency
      Room.belongsToMany(models.Dependency, {
        through: models.DependencyRooms,
        foreignKey: 'RoomId',
        otherKey: 'DependencyId',
        as: 'dependencies',
      });
    }
  }
  Room.init(
    {
      name: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      description: DataTypes.TEXT,
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      staffowner: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      imagePath: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isInCUC: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: 'Room',
    }
  );
  return Room;
};

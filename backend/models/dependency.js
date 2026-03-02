'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Dependency extends Model {
    static associate(models) {
      // relación muchos a muchos con Room
      Dependency.belongsToMany(models.Room, {
        through: models.DependencyRooms,
        foreignKey: 'DependencyId',
        otherKey: 'RoomId',
        as: 'rooms',
      });

      // relación muchos a muchos con User (coordinadores)
      Dependency.belongsToMany(models.User, {
        through: models.CoordinatorDependencies,
        foreignKey: 'DependencyId',
        otherKey: 'UserId',
        as: 'coordinators',
      });
    }
  }

  Dependency.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Dependency',
    }
  );
  return Dependency;
};

'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CoordinatorDependencies extends Model {
    static associate(models) {
      CoordinatorDependencies.belongsTo(models.Dependency, {
        foreignKey: 'DependencyId',
        as: 'dependency',
      });
      CoordinatorDependencies.belongsTo(models.User, {
        foreignKey: 'UserId',
        as: 'user',
      });
    }
  }

  CoordinatorDependencies.init(
    {
      UserId: {
        type: DataTypes.INTEGER,
        unique: 'compositeIndex',
        allowNull: false,
      },
      DependencyId: {
        type: DataTypes.INTEGER,
        unique: 'compositeIndex',
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'CoordinatorDependencies',
      id: false,
      primaryKeys: ['UserId', 'DependencyId'],
      timestamps: false,
    }
  );
  return CoordinatorDependencies;
};

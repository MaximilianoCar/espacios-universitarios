'use strict';

module.exports = (sequelize, DataTypes) => {
  const Entity = sequelize.define(
    'Entity',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
    },
    {
      tableName: 'Entities',
    }
  );

  return Entity;
};

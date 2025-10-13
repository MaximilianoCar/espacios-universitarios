'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Room extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Room.hasMany(models.Event, {
        foreignKey: 'roomId',
        as: 'events', // Alias para los eventos asociados
      });
    }
  }
  Room.init(
    {
      name: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false, // Este campo es obligatorio
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
        allowNull: true, // Puede ser nulo si no se sube imagen
      },
    },
    {
      sequelize,
      modelName: 'Room',
    }
  );
  return Room;
};

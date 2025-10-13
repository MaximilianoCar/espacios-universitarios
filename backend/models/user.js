'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt'); // Asumiendo que quieres encriptar las contraseñas

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Event, {
        foreignKey: 'userId',
        as: 'events', // Alias para los eventos asociados
      });
    }

    // Agregamos propiedades estáticas para roles
    static get ROLES() {
      return {
        ADMIN: 'admin',
        USER: 'user',
      };
    }
    // Método estático para crear un administrador
    static async createAdmin(data) {
      data.role = this.ROLES.ADMIN; // Asignar rol de admin
      data.password = await bcrypt.hash(data.password, 10); // Encriptar la contraseña
      data.status = true;
      return this.create(data);
    }

    // Método estático para crear un usuario normal
    static async createUser(data) {
      data.role = this.ROLES.USER; // Asignar rol de usuario
      data.password = await bcrypt.hash(data.password, 10); // Encriptar la contraseña
      data.status = true;
      return this.create(data);
    }
  }

  User.init(
    {
      role: {
        type: DataTypes.ENUM(User.ROLES.ADMIN, User.ROLES.USER), // Solo permite los valores 'admin' o 'user'
        allowNull: false, // Campo obligatorio
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false, // Campo obligatorio
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false, // Campo obligatorio
        unique: true, // El correo debe ser único
        validate: {
          isEmail: true, // Valida que el campo sea un correo válido
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false, // Campo obligatorio
      },
      ci: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true, // Campo obligatorio
      },
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: false, // Campo obligatorio
      },
      refreshToken: {
        type: DataTypes.TEXT, // Puede ser STRING o TEXT dependiendo del tamaño del token
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
    }
  );
  return User;
};

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

      User.belongsToMany(models.Room, {
        through: models.CoordinatorRooms,
        foreignKey: 'UserId',
        otherKey: 'RoomId',
        as: 'managedRooms',
      });
    }

    // Agregamos propiedades estáticas para roles
    static get ROLES() {
      // Usamos el nombre del rol en inglés como clave y el string de la DB como valor
      return {
        ADMINISTRATOR: 'admin',
        COORDINATOR: 'coordinator',
        REQUESTER: 'requester',
        VISITOR: 'visitor',
        PENDING: 'pending',
      };
    }

    // ----------------------------------------------------------------------
    // MÉTODOS ESTÁTICOS DE CREACIÓN
    // ----------------------------------------------------------------------

    // Método estático para crear un administrador
    static async createAdmin(data) {
      data.role = this.ROLES.ADMINISTRATOR;
      data.password = await bcrypt.hash(data.password, 10);
      data.status = true;
      return this.create(data);
    }

    // Método estático para crear un coordinador
    static async createCoordinator(data) {
      data.role = this.ROLES.COORDINATOR;
      data.password = await bcrypt.hash(data.password, 10);
      data.status = true;
      return this.create(data);
    }

    // Método estático para crear un visitante (rol por defecto al registrarse)
    static async createVisitor(data) {
      // Un 'visitor' se registra, por lo que necesita contraseña
      data.role = this.ROLES.VISITOR;
      data.password = await bcrypt.hash(data.password, 10);
      data.status = true;
      return this.create(data);
    }

    // Método estático para crear un requester
    static async createRequester(data) {
      data.role = this.ROLES.REQUESTER;
      data.password = await bcrypt.hash(data.password, 10);
      data.status = true;
      return this.create(data);
    }

    // ----------------------------------------------------------------------
    // Cambio de rol
    // ----------------------------------------------------------------------

    /**
     * Permite que un usuario con rol 'visitor' cambie su rol a 'requester'.
     * @returns {User} El usuario actualizado.
     */
    async upgradeToRequester() {
      if (this.role !== User.ROLES.PENDING) {
        throw new Error(
          `User with role '${this.role}' cannot be upgraded to requester. Only 'pending' users can apply.`
        );
      }

      this.role = User.ROLES.REQUESTER;

      return this.save();
    }

    async changeToPending() {
      if (this.role !== User.ROLES.VISITOR) {
        throw new Error(
          `User with role '${this.role}' Only 'visitor' users can apply.`
        );
      }

      this.role = User.ROLES.PENDING;

      return this.save();
    }

    async changeToVisitor() {
      if (this.role !== User.ROLES.PENDING) {
        throw new Error(
          `User with role '${this.role}' Only 'pending' users can apply.`
        );
      }

      this.role = User.ROLES.VISITOR;

      return this.save();
    }
  }

  // DEFINICION DEL MODELO

  User.init(
    {
      role: {
        type: DataTypes.ENUM(
          User.ROLES.ADMINISTRATOR,
          User.ROLES.COORDINATOR,
          User.ROLES.REQUESTER,
          User.ROLES.VISITOR,
          User.ROLES.PENDING
        ),
        allowNull: false,
        defaultValue: User.ROLES.VISITOR, // El rol por defecto será VISITOR
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ci: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
      },
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      certificationPath: {
        type: DataTypes.STRING,
        allowNull: true, // nulo por defecto hasta que suba un documento
      },
    },
    {
      sequelize,
      modelName: 'User',
      hooks: {
        // Antes de la validación, si el campo 'role' no tiene valor, asigna el rol por defecto
        beforeValidate: user => {
          if (!user.role) {
            user.role = User.ROLES.VISITOR;
          }
        },
        // Antes de crear, si el CI está vacío, se pone a null (para evitar strings vacíos en campo unique)
        beforeCreate: user => {
          if (user.ci === '') {
            user.ci = null;
          }
        },
      },
    }
  );
  return User;
};

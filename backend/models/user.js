'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Event, {
        foreignKey: 'userId',
        as: 'events',
      });

      // relación con Dependency (reemplaza managedRooms)
      User.belongsToMany(models.Dependency, {
        through: models.CoordinatorDependencies,
        foreignKey: 'UserId',
        otherKey: 'DependencyId',
        as: 'managedDependencies',
      });
    }

    static get ROLES() {
      return {
        ADMINISTRATOR: 'admin',
        COORDINATOR: 'coordinator',
        REQUESTER: 'requester',
        VISITOR: 'visitor',
        EXTERNAL_VISITOR: 'externalvisitor',
        PENDING: 'pending',
      };
    }

    // Método estático para crear un administrador
    static async createAdmin(data) {
      data.role = this.ROLES.ADMINISTRATOR;
      data.password = await bcrypt.hash(data.password, 10);
      data.status = true;
      data.isExternal = false; // Por defecto, admin no es externo
      data.isCompanyRepresentative = false; // Por defecto, no representa empresa
      return this.create(data);
    }

    // Método estático para crear un coordinador
    static async createCoordinator(data) {
      data.role = this.ROLES.COORDINATOR;
      data.password = await bcrypt.hash(data.password, 10);
      data.status = true;
      data.isExternal = false; // Por defecto, coordinador no es externo
      data.isCompanyRepresentative = false; // Por defecto, no representa empresa
      return this.create(data);
    }

    // Método estático para crear un visitante interno (miembro de la comunidad)
    static async createInternalVisitor(data) {
      data.role = this.ROLES.VISITOR;
      data.password = await bcrypt.hash(data.password, 10);
      data.status = true;
      data.isExternal = false; // Siempre false para visitor interno
      data.isCompanyRepresentative = false; // Por defecto false
      return this.create(data);
    }

    // Método estático para crear un visitante externo
    static async createExternalVisitor(data) {
      data.role = this.ROLES.EXTERNAL_VISITOR;
      data.password = await bcrypt.hash(data.password, 10);
      data.status = true;
      data.isExternal = true; // Siempre true para externalvisitor
      data.isCompanyRepresentative = false; // Por defecto false, se completará después
      return this.create(data);
    }

    // Método estático para crear un requester
    static async createRequester(data) {
      data.role = this.ROLES.REQUESTER;
      data.password = await bcrypt.hash(data.password, 10);
      data.status = true;
      return this.create(data);
    }

    /**
     * Permite que un usuario con rol 'pending' cambie su rol a 'requester'.
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

    /**
     * Cambia el rol a 'pending' (solicitud en revisión)
     */
    async changeToPending() {
      const allowedRoles = [User.ROLES.VISITOR, User.ROLES.EXTERNAL_VISITOR];
      if (!allowedRoles.includes(this.role)) {
        throw new Error(
          `User with role '${this.role}' cannot request upgrade. Only 'visitor' or 'externalvisitor' users can apply.`
        );
      }

      this.role = User.ROLES.PENDING;

      return this.save();
    }

    /**
     * Cambia el rol de 'pending' a 'visitor' (rechazo de solicitud)
     */
    async changeToVisitor() {
      if (this.role !== User.ROLES.PENDING) {
        throw new Error(
          `User with role '${this.role}' cannot be changed to visitor. Only 'pending' users can be rejected.`
        );
      }

      this.role = User.ROLES.VISITOR;

      return this.save();
    }

    /**
     * Cambia el rol de 'pending' a 'externalvisitor' (rechazo de solicitud para externos)
     */
    async changeToExternalVisitor() {
      if (this.role !== User.ROLES.PENDING) {
        throw new Error(
          `User with role '${this.role}' cannot be changed to externalvisitor. Only 'pending' users can be rejected.`
        );
      }

      this.role = User.ROLES.EXTERNAL_VISITOR;

      return this.save();
    }

    /**
     * Completa la información de un usuario externalvisitor
     */
    async completeExternalInfo(data, certificationPath) {
      if (this.role !== User.ROLES.EXTERNAL_VISITOR) {
        throw new Error(
          'Solo los usuarios externalvisitor pueden completar información'
        );
      }

      const { isCompanyRepresentative, companyName, companyRif, origin } = data;

      // Marcar si es representante de empresa y validar campos cuando aplique
      this.isCompanyRepresentative = Boolean(isCompanyRepresentative);

      if (this.isCompanyRepresentative) {
        if (!companyName || !companyRif) {
          throw new Error(
            'Los usuarios que representan una empresa deben proporcionar nombre y RIF'
          );
        }
        this.companyName = companyName;
        this.companyRif = companyRif;
      } else {
        this.companyName = null;
        this.companyRif = null;
      }

      if (certificationPath) {
        this.certificationPath = certificationPath;
      }

      // Asegurar que el usuario se marque como externo y cambiar su rol a pending
      this.isExternal = true;
      // Guardar el rol original será manejado por los hooks (beforeUpdate)
      this.role = User.ROLES.PENDING;

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
          User.ROLES.EXTERNAL_VISITOR, // NUEVO ROL
          User.ROLES.PENDING
        ),
        allowNull: false,
        defaultValue: User.ROLES.VISITOR,
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
        allowNull: true,
      },
      resetCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetCodeExpiry: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isExternal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Indica si el usuario es externo a la universidad',
      },
      isCompanyRepresentative: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Indica si el usuario viene en representación de una empresa',
      },
      companyRif: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [0, 20],
            msg: 'El RIF debe tener máximo 20 caracteres',
          },
        },
        comment:
          'RIF de la empresa que representa (solo si isCompanyRepresentative es true)',
      },
      companyName: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [0, 100],
            msg: 'El nombre de la empresa debe tener máximo 100 caracteres',
          },
        },
        comment:
          'Nombre de la empresa/organización que representa (solo si isCompanyRepresentative es true)',
      },
    },
    {
      sequelize,
      modelName: 'User',
      hooks: {
        beforeValidate: user => {
          // Establecer rol por defecto si no existe
          if (!user.role) {
            user.role = User.ROLES.VISITOR;
          }

          // Establecer valores por defecto si no existen
          if (user.isExternal === undefined) {
            // Si es externalvisitor, asegurar que isExternal sea true
            user.isExternal = user.role === User.ROLES.EXTERNAL_VISITOR;
          }

          if (user.isCompanyRepresentative === undefined) {
            user.isCompanyRepresentative = false;
          }

          // Validación: si no es representante de empresa, limpiar companyRif y companyName
          if (!user.isCompanyRepresentative) {
            user.companyRif = null;
            user.companyName = null;
          }

          // Validación: si es externalvisitor y representante de empresa, verificar que tenga RIF y nombre
          if (
            user.role === User.ROLES.EXTERNAL_VISITOR &&
            user.isCompanyRepresentative &&
            (!user.companyRif || !user.companyName)
          ) {
            throw new Error(
              'Los usuarios externos que representan una empresa deben proporcionar el RIF y nombre de la empresa'
            );
          }
        },
        beforeCreate: user => {
          // Limpiar CI si está vacío
          if (user.ci === '') {
            user.ci = null;
          }

          // Asegurar consistencia entre role e isExternal
          if (user.role === User.ROLES.EXTERNAL_VISITOR) {
            user.isExternal = true;
          } else if (user.role === User.ROLES.VISITOR) {
            user.isExternal = false;
          }

          // Asegurar que companyRif y companyName sean null si no es representante de empresa
          if (!user.isCompanyRepresentative) {
            user.companyRif = null;
            user.companyName = null;
          }

          // Guardar rol original si está cambiando a pending
          if (user.role === User.ROLES.PENDING && !user.originalRole) {
            user.originalRole = user.role;
          }
        },
        beforeUpdate: user => {
          // Mantener consistencia entre role e isExternal
          if (user.role === User.ROLES.EXTERNAL_VISITOR) {
            user.isExternal = true;
          } else if (user.role === User.ROLES.VISITOR) {
            user.isExternal = false;
          }

          // Asegurar que companyRif y companyName sean null si no es representante de empresa
          if (!user.isCompanyRepresentative) {
            user.companyRif = null;
            user.companyName = null;
          }

          // Validación: si es externalvisitor y representante de empresa, verificar que tenga RIF y nombre
          if (
            user.role === User.ROLES.EXTERNAL_VISITOR &&
            user.isCompanyRepresentative &&
            (!user.companyRif || !user.companyName)
          ) {
            throw new Error(
              'Los usuarios externos que representan una empresa deben proporcionar el RIF y nombre de la empresa'
            );
          }

          // Guardar rol original cuando cambia a pending
          if (user.role === User.ROLES.PENDING && !user.originalRole) {
            user.originalRole = user._previousDataValues.role;
          }
        },
      },
    }
  );
  return User;
};

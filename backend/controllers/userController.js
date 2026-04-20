const { User } = require('../models');
const { sequelize } = require('../models');
const { CoordinatorDependencies } = require('../models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { addToBlacklist } = require('../utils/blacklist');
const path = require('path');
const fs = require('fs').promises;
const emailService = require('../services/emailService');
require('dotenv').config();

// Controlador para crear un usuario normal (registro público)
exports.createUser = async (req, res) => {
  try {
    let { name, email, password, ci, isExternal } = req.body;
    email = email.toLowerCase();

    // Validar campos requeridos
    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Nombre, email y contraseña son obligatorios.',
      });
    }

    // Verificar si el correo ya está registrado
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'El correo ya está en uso.' });
    }

    // Validar CI si se proporciona
    if (ci) {
      const existingUserCI = await User.findOne({ where: { ci } });
      if (existingUserCI) {
        return res.status(400).json({ error: 'La cédula ya está en uso.' });
      }
    }

    // Convertir isExternal a booleano (por defecto false - interno)
    const externalFlag = isExternal !== undefined ? Boolean(isExternal) : false;

    let newUser;

    // Crear usuario según si es externo o interno
    if (externalFlag) {
      // Usuario externo - crear como externalvisitor
      newUser = await User.createExternalVisitor({
        name,
        email,
        password,
        ci: ci || null,
        isExternal: true,
        isCompanyRepresentative: false, // Por defecto false en registro público
        companyRif: null, // Por defecto null en registro público
        companyName: null, // Por defecto null en registro público
      });
    } else {
      // Usuario interno - crear como visitor
      newUser = await User.createInternalVisitor({
        name,
        email,
        password,
        ci: ci || null,
        isExternal: false,
        isCompanyRepresentative: false,
        companyRif: null,
        companyName: null,
      });
    }

    // No retornar la contraseña en la respuesta
    const { password: _, ...userWithoutPassword } = newUser.toJSON();

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error al crear usuario:', error);

    // Manejo de errores específicos de validación
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message).join(', ');
      return res.status(400).json({ error: messages });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'El correo o cédula ya están registrados.',
      });
    }

    res.status(500).json({
      error: 'Error al crear el usuario.',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// crear cualquier usuario
// crear cualquier usuario (panel de admin)
exports.createAnyUser = async (req, res) => {
  try {
    let {
      name,
      email,
      password,
      ci,
      role,
      isExternal,
      isCompanyRepresentative,
      companyRif,
      companyName,
    } = req.body;
    email = email.toLowerCase();

    // Validaciones básicas
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        error: 'Nombre, email, contraseña y rol son obligatorios.',
      });
    }

    // Verificar si el correo ya está registrado
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'El correo ya está en uso.' });
    }

    if (ci) {
      const existingUserCI = await User.findOne({ where: { ci } });
      if (existingUserCI) {
        return res.status(400).json({ error: 'Cédula ya está en uso.' });
      }
    }

    // Procesar campos booleanos
    const externalFlag = isExternal !== undefined ? Boolean(isExternal) : false;
    const companyRepFlag =
      isCompanyRepresentative !== undefined
        ? Boolean(isCompanyRepresentative)
        : false;

    // Validar consistencia entre rol y isExternal
    if (role === 'externalvisitor' && !externalFlag) {
      return res.status(400).json({
        error: 'El rol externalvisitor requiere isExternal = true',
      });
    }

    if (role === 'visitor' && externalFlag) {
      return res.status(400).json({
        error: 'El rol visitor requiere isExternal = false',
      });
    }

    let newUser;

    // Crear usuario según el rol especificado
    switch (role) {
      case 'admin':
        newUser = await User.createAdmin({
          name,
          email,
          password,
          ci: ci || null,
          isExternal: externalFlag,
          isCompanyRepresentative: companyRepFlag,
          companyRif: companyRepFlag ? companyRif : null,
          companyName: companyRepFlag ? companyName : null,
        });
        break;
      case 'coordinator':
        newUser = await User.createCoordinator({
          name,
          email,
          password,
          ci: ci || null,
          isExternal: externalFlag,
          isCompanyRepresentative: companyRepFlag,
          companyRif: companyRepFlag ? companyRif : null,
          companyName: companyRepFlag ? companyName : null,
        });
        break;
      case 'requester':
        newUser = await User.createRequester({
          name,
          email,
          password,
          ci: ci || null,
          isExternal: externalFlag,
          isCompanyRepresentative: companyRepFlag,
          companyRif: companyRepFlag ? companyRif : null,
          companyName: companyRepFlag ? companyName : null,
        });
        break;
      case 'visitor':
        newUser = await User.createInternalVisitor({
          name,
          email,
          password,
          ci: ci || null,
          isExternal: externalFlag,
          isCompanyRepresentative: companyRepFlag,
          companyRif: companyRepFlag ? companyRif : null,
          companyName: companyRepFlag ? companyName : null,
        });
        break;
      case 'externalvisitor':
        newUser = await User.createExternalVisitor({
          name,
          email,
          password,
          ci: ci || null,
          isExternal: true, // Siempre true para externalvisitor
          isCompanyRepresentative: companyRepFlag,
          companyRif: companyRepFlag ? companyRif : null,
          companyName: companyRepFlag ? companyName : null,
        });
        break;
      case 'pending':
        // Para pending, creamos como visitor primero y luego cambiamos
        newUser = await User.createInternalVisitor({
          name,
          email,
          password,
          ci: ci || null,
          isExternal: externalFlag,
          isCompanyRepresentative: companyRepFlag,
          companyRif: companyRepFlag ? companyRif : null,
          companyName: companyRepFlag ? companyName : null,
        });
        newUser = await newUser.update({ role: 'pending' });
        break;
      default:
        return res.status(400).json({ error: 'Rol no válido.' });
    }

    // No retornar la contraseña en la respuesta
    const { password: _, ...userWithoutPassword } = newUser.toJSON();

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);

    // Manejo de errores específicos
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message).join(', ');
      return res.status(400).json({ error: messages });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'El correo o cédula ya están registrados.',
      });
    }

    res.status(500).json({
      error: 'Error al crear el usuario.',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
// Controlador para crear un administrador
exports.createAdmin = async (req, res) => {
  try {
    let { name, email, password } = req.body;
    email = email.toLowerCase();

    // Verificar si el correo ya está registrado
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'El correo ya está en uso.' });
    }

    // Crear un nuevo administrador utilizando el método estático
    const newAdmin = await User.createAdmin({
      name,
      email,
      password,
    });

    res.status(201).json(newAdmin);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el administrador.' });
  }
};

// Completar información de usuario externo
exports.completeExternalUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Verificar que el usuario sea EXTERNAL_VISITOR (no solo visitor externo)
    if (user.role !== User.ROLES.EXTERNAL_VISITOR) {
      return res.status(400).json({
        error:
          'Esta función solo está disponible para usuarios externalvisitor.',
      });
    }

    const { isCompanyRepresentative, origin, companyName, companyRif } =
      req.body;
    const certificationFile = req.file;

    console.log(
      'Datos recibidos para completar información de usuario externo:',
      {
        isCompanyRepresentative,
        origin,
        companyName,
        companyRif,
      }
    );

    // Validar archivo
    if (!certificationFile) {
      return res.status(400).json({
        error: 'Debe subir un documento de cédula de identidad.',
      });
    }

    // Validar campos
    if (!origin) {
      return res.status(400).json({
        error: 'Debe especificar de dónde viene.',
      });
    }

    // Usar el método del modelo para completar la información
    await user.completeExternalInfo(
      {
        isCompanyRepresentative,
        origin,
        companyName,
        companyRif,
      },
      certificationFile.path
    );

    res.status(200).json({
      message: 'Información completada exitosamente.',
      user: {
        id: user.id,
        isCompanyRepresentative: user.isCompanyRepresentative,
        companyName: user.companyName,
        companyRif: user.companyRif,
        certificationPath: user.certificationPath,
      },
    });
  } catch (error) {
    console.error('Error al completar información de usuario externo:', error);

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res
        .status(400)
        .json({ error: 'El archivo es demasiado grande (máx. 5MB).' });
    }

    // Manejo de errores del modelo
    if (error.message.includes('Solo los usuarios externalvisitor')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: 'Error interno del servidor al completar la información.',
    });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'refreshToken'] },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// Obtener todos los usuarios

exports.getUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 25;
  const searchTerm = req.query.search || '';
  const rolesString = req.query.roles || '';

  const offset = (page - 1) * pageSize;

  try {
    let whereCondition = {};

    // Si hay ambos filtros
    if (searchTerm && rolesString) {
      const rolesArray = rolesString.split(',');
      const lowerCaseSearch = `%${searchTerm.toLowerCase()}%`;

      whereCondition = {
        [Op.and]: [
          { role: { [Op.in]: rolesArray } },
          {
            [Op.or]: [
              { name: { [Op.iLike]: lowerCaseSearch } },
              { email: { [Op.iLike]: lowerCaseSearch } },
              { ci: { [Op.iLike]: lowerCaseSearch } },
              sequelize.where(
                sequelize.cast(sequelize.col('User.role'), 'text'),
                { [Op.iLike]: lowerCaseSearch }
              ),
            ],
          },
        ],
      };
    }
    // Solo filtro de roles
    else if (rolesString) {
      const rolesArray = rolesString.split(',');
      whereCondition = { role: { [Op.in]: rolesArray } };
    }
    // Solo búsqueda
    else if (searchTerm) {
      const lowerCaseSearch = `%${searchTerm.toLowerCase()}%`;
      whereCondition = {
        [Op.or]: [
          { name: { [Op.iLike]: lowerCaseSearch } },
          { email: { [Op.iLike]: lowerCaseSearch } },
          { ci: { [Op.iLike]: lowerCaseSearch } },
          // Convertir el campo ENUM a texto para poder usar ILIKE
          sequelize.where(sequelize.cast(sequelize.col('User.role'), 'text'), {
            [Op.iLike]: lowerCaseSearch,
          }),
        ],
      };
    }
    // Sin filtros
    else {
      whereCondition = {};
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereCondition,
      limit: pageSize,
      offset: offset,
      order: [['name', 'ASC']],
    });

    const totalPages = Math.ceil(count / pageSize);

    res.status(200).json({
      totalUsers: count,
      totalPages: totalPages,
      currentPage: page,
      users: rows,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener los usuarios',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// obtener usuarios pending con paginación y búsqueda
exports.getPendingUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 25;
  const searchTerm = req.query.search || '';

  const offset = (page - 1) * pageSize;

  try {
    let whereCondition = { role: User.ROLES.PENDING };

    if (searchTerm) {
      const lowerCaseSearch = `%${searchTerm.toLowerCase()}%`;
      whereCondition = {
        ...whereCondition,
        [Op.or]: [
          { name: { [Op.iLike]: lowerCaseSearch } },
          { email: { [Op.iLike]: lowerCaseSearch } },
          { ci: { [Op.iLike]: lowerCaseSearch } },
        ],
      };
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereCondition,
      attributes: [
        'id',
        'name',
        'email',
        'ci',
        'certificationPath',
        'isExternal',
        'isCompanyRepresentative',
        'companyName',
        'companyRif',
        'createdAt',
      ],
      limit: pageSize,
      offset: offset,
      order: [['createdAt', 'ASC']],
    });

    const totalPages = Math.ceil(count / pageSize);

    res.status(200).json({
      totalUsers: count,
      totalPages: totalPages,
      currentPage: page,
      users: rows,
    });
  } catch (error) {
    console.error('Error al listar los usuarios pendientes:', error);
    res
      .status(500)
      .json({ error: 'Error al listar las solicitudes pendientes.' });
  }
};

// Obtener un usuario por ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ error: 'Usuario no encontrado.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar el usuario.' });
  }
};

// Actualizar un usuario
exports.updateUser = async (req, res) => {
  try {
    const { name, email, status } = req.body;

    const [updated] = await User.update(req.body, {
      where: { id: req.params.id },
    });

    if (updated) {
      const updatedUser = await User.findByPk(req.params.id);
      res.status(200).json(updatedUser);
    } else {
      res.status(404).json({ error: 'Usuario no encontrado.' });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    const {
      UniqueConstraintError,
      ValidationError,
      ForeignKeyConstraintError,
    } = require('sequelize');
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({
        error:
          error.errors[0]?.message ||
          'Conflicto de integridad (cédula o correo ya en uso por otro usuario).',
      });
    }
    if (error instanceof ValidationError) {
      const messages = error.errors.map(e => e.message).join('; ');
      return res.status(400).json({ error: messages });
    }
    if (error instanceof ForeignKeyConstraintError) {
      return res.status(409).json({
        error:
          'No se puede actualizar el usuario debido a relaciones existentes.',
      });
    }

    res.status(500).json({ error: 'Error al actualizar el usuario.' });
  }
};

// Eliminar un usuario
exports.deleteUser = async (req, res) => {
  const transaction = await User.sequelize.transaction();
  try {
    const user = await User.findByPk(req.params.id, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Eliminar permisos (CoordinatorDependencies) si existen
    await CoordinatorDependencies.destroy({
      where: { UserId: user.id },
      transaction,
    });

    // Eliminar el usuario (eventos relacionados tienen ON DELETE CASCADE según el modelo)
    await user.destroy({ transaction });

    await transaction.commit();
    return res.status(204).send();
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting user:', error);
    const {
      ForeignKeyConstraintError,
      UniqueConstraintError,
      ValidationError,
    } = require('sequelize');
    if (error instanceof ForeignKeyConstraintError) {
      return res.status(409).json({
        error:
          'No se puede eliminar el usuario porque existen registros relacionados (p.ej. eventos, permisos). Elimine o reasigne esos registros antes de intentar eliminar.',
      });
    }
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({
        error: error.errors[0]?.message || 'Conflicto de integridad.',
      });
    }
    if (error instanceof ValidationError) {
      const messages = error.errors.map(e => e.message).join('; ');
      return res.status(400).json({ error: messages });
    }

    res.status(500).json({ error: 'Error al eliminar el usuario.' });
  }
};

exports.requestUpgrade = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Permitir tanto VISITOR como EXTERNAL_VISITOR solicitar upgrade
    const allowedRoles = [User.ROLES.VISITOR, User.ROLES.EXTERNAL_VISITOR];
    if (!allowedRoles.includes(user.role)) {
      return res.status(400).json({
        error: `Tu rol actual ('${user.role}') no requiere esta solicitud.`,
      });
    }

    const certificationFile = req.file;

    if (!certificationFile) {
      return res
        .status(400)
        .json({ error: 'Debe subir un documento de certificación válido.' });
    }

    // La propiedad 'path' es proporcionada por Multer
    user.certificationPath = certificationFile.path;

    // Usar el método del modelo para cambiar a pending
    await user.changeToPending();

    // Notificar a administradores
    try {
      const admins = await User.findAll({
        where: { role: User.ROLES.ADMINISTRATOR },
      });

      if (admins.length > 0) {
        const adminEmails = admins.map(admin => admin.email);
        await emailService.notifyUpgradeRequest(
          adminEmails,
          user.email,
          user.name
        );
        console.log(
          `Notificaciones enviadas a ${adminEmails.length} administradores`
        );
      }
    } catch (emailError) {
      console.error('Error enviando notificaciones:', emailError);
    }

    res.status(200).json({
      message:
        'Solicitud enviada con éxito. Un administrador revisará tu documento pronto.',
      path: user.certificationPath,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error al procesar la solicitud de certificación:', error);

    // Manejo de errores del modelo
    if (error.message.includes('cannot request upgrade')) {
      return res.status(400).json({ error: error.message });
    }

    // Si el error viene de Multer
    if (
      error.code === 'LIMIT_FILE_SIZE' ||
      error.message.includes('Tipo de archivo')
    ) {
      return res.status(400).json({ error: error.message });
    }

    res
      .status(500)
      .json({ error: 'Error interno del servidor al subir el archivo.' });
  }
};

//aprueba solicitud pendiente
exports.approveRequest = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const filePath = user.certificationPath;

    // 1. Eliminar el archivo físico (si existe)
    if (filePath) {
      // La lógica de eliminación similar a deleteRoom
      const absolutePath = path.join(process.cwd(), filePath);

      try {
        await fs.unlink(absolutePath); // Borrar el archivo
        // Opcional: console.log(`Archivo de certificación eliminado: ${absolutePath}`);
      } catch (fileError) {
        if (fileError.code === 'ENOENT') {
          console.warn(
            `Advertencia: Archivo de certificación no encontrado en el disco para el usuario ${userId}: ${absolutePath}`
          );
        } else {
          console.error(
            `Error al eliminar el archivo físico para el usuario ${userId}:`,
            fileError
          );
          // Opcional: No detener el proceso si el archivo no se puede borrar, solo registrar el error
        }
      }
    }

    // Usar el método del modelo para cambiar de rol y validar
    await user.upgradeToRequester();

    // notificacion al usuario aprobado
    try {
      await emailService.notifyUpgradeResult(user.email, user.name, true, '');
      console.log(`Notificación de aprobación enviada a: ${user.email}`);
    } catch (emailError) {
      console.error('Error enviando notificación de aprobación:', emailError);
    }

    res.status(200).json({
      message:
        'Solicitud aprobada con éxito. El usuario ahora es Solicitante (Requester).',
      user: user,
    });
  } catch (error) {
    // Captura el error de validación del modelo (ej: si el rol no es 'pending')
    if (error.message.includes('cannot be upgraded')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al aprobar la solicitud:', error);
    res
      .status(500)
      .json({ error: 'Error al procesar la aprobación de la solicitud.' });
  }
};

// Rechaza una solicitud pendiente..

exports.rejectRequest = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Verificar que el usuario esté en estado pending
    if (user.role !== User.ROLES.PENDING) {
      return res.status(400).json({
        error: 'Solo se pueden rechazar solicitudes de usuarios pendientes.',
      });
    }

    // Determinar si el usuario original era externalvisitor
    // Buscar en diferentes lugares donde podría estar almacenado el rol original
    const wasExternalVisitor =
      user._previousDataValues?.role === User.ROLES.EXTERNAL_VISITOR ||
      (user.dataValues &&
        user.dataValues.originalRole === User.ROLES.EXTERNAL_VISITOR) ||
      user.originalRole === User.ROLES.EXTERNAL_VISITOR ||
      // Si no hay datos previos, verificar si tiene isExternal = true como referencia
      (user.isExternal === true && user.role === User.ROLES.PENDING);

    const filePath = user.certificationPath;

    // 1. Eliminar el archivo físico (si existe)
    if (filePath) {
      const absolutePath = path.join(process.cwd(), filePath);
      try {
        await fs.unlink(absolutePath);
      } catch (fileError) {
        if (fileError.code === 'ENOENT') {
          console.warn(
            `Advertencia: Archivo de certificación no encontrado en el disco para el usuario ${userId}: ${absolutePath}`
          );
        } else {
          console.error(
            `Error al eliminar el archivo físico para el usuario ${userId}:`,
            fileError
          );
        }
      }
    }

    // Cambiar de rol según si era externalvisitor o visitor
    try {
      if (wasExternalVisitor) {
        await user.changeToExternalVisitor();
      } else {
        await user.changeToVisitor();
      }
    } catch (modelError) {
      // Si falla el método del modelo, usar una alternativa
      if (wasExternalVisitor) {
        user.role = User.ROLES.EXTERNAL_VISITOR;
        user.isExternal = true;
      } else {
        user.role = User.ROLES.VISITOR;
        user.isExternal = false;
      }
      user.certificationPath = null;
      await user.save();
    }

    // Limpiar campos relacionados
    user.certificationPath = null;
    await user.save();

    // Notificación al usuario rechazado
    try {
      const comments = req.body.comments || ''; // Opcional: comentarios del admin
      await emailService.notifyUpgradeResult(
        user.email,
        user.name,
        false,
        comments
      );
      console.log(`Notificación de rechazo enviada a: ${user.email}`);
    } catch (emailError) {
      console.error('Error enviando notificación de rechazo:', emailError);
    }

    res.status(200).json({
      message: wasExternalVisitor
        ? 'Solicitud rechazada con éxito. El usuario volvió a ser Visitante Externo (External Visitor).'
        : 'Solicitud rechazada con éxito. El usuario volvió a ser Visitante (Visitor).',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isExternal: user.isExternal,
      },
    });
  } catch (error) {
    console.error('Error al rechazar la solicitud:', error);

    // Manejo específico de errores del modelo
    if (error.message && error.message.includes('Only pending users')) {
      return res.status(400).json({ error: error.message });
    }

    // Manejo de errores de validación de Sequelize
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message).join('; ');
      return res.status(400).json({ error: messages });
    }

    // Manejo de errores de restricción única
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Error de restricción única en la base de datos.',
      });
    }

    res.status(500).json({
      error:
        'Error interno del servidor al procesar el rechazo de la solicitud.',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Iniciar sesión y generar JWT + Refresh Token
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.toLowerCase();
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Contraseña incorrecta.' });
    }

    const isActive = user.status;
    if (!isActive) {
      return res.status(403).json({ error: 'El usuario está inactivo.' });
    }

    // Generar el token de acceso
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Generar el refresh token
    const refreshToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    // Guardar el refresh token en la base de datos
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      data: {
        name: user.name,
        role: user.role,
        token,
        refreshToken, // Enviamos el refresh token al cliente
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error al iniciar sesión.' });
  }
};

//loguot
exports.logout = async (req, res) => {
  try {
    // Obtener el token del request protect
    const token = req.headers.authorization.split(' ')[1];

    // Decodificar para obtener la expiración
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.exp) {
      return res
        .status(400)
        .json({ error: 'Token inválido o sin expiración.' });
    }

    addToBlacklist(token, decoded.exp);

    res.status(200).json({
      message: 'Cierre de sesión exitoso. El token ha sido invalidado.',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error al cerrar sesión.' });
  }
};

// Endpoint para renovar el token de acceso
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(403).json({ error: 'Refresh token es requerido.' });
  }

  try {
    // Verificar el refresh token
    const user = await User.findOne({ where: { refreshToken } });
    if (!user) {
      return res.status(403).json({ error: 'Refresh token no es válido.' });
    }

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err) {
          return res.status(403).json({ error: 'Refresh token ha expirado.' });
        }

        // Generar un nuevo token de acceso
        const newAccessToken = jwt.sign(
          { id: user.id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        res.status(200).json({
          token: newAccessToken,
        });
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error al renovar el token.' });
  }
};

// Iniciar flujo de restablecimiento de contraseña: validar email+ci y enviar código
exports.requestPasswordReset = async (req, res) => {
  try {
    let { email, ci } = req.body;
    if (!email || !ci) {
      return res.status(400).json({ error: 'Email y cédula son requeridos.' });
    }

    email = email.toLowerCase();

    const user = await User.findOne({ where: { email, ci } });
    if (!user) {
      return res
        .status(404)
        .json({ error: 'Usuario no encontrado con esos datos.' });
    }

    // generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    user.resetCode = code;
    user.resetCodeExpiry = expiry;
    await user.save();

    // enviar correo con código
    try {
      await emailService.notifyPasswordReset(user.email, user.name, code);
    } catch (emailError) {
      console.error('Error enviando código de restablecimiento:', emailError);
      // no revelar detalles al cliente
    }

    return res
      .status(200)
      .json({ message: 'Código enviado al correo si el usuario existe.' });
  } catch (error) {
    console.error('requestPasswordReset error:', error);
    return res
      .status(500)
      .json({ error: 'Error interno al solicitar restablecimiento.' });
  }
};

// Verificar código enviado
exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email y código son requeridos.' });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user || !user.resetCode || !user.resetCodeExpiry) {
      return res.status(400).json({ valid: false, error: 'Código inválido.' });
    }

    if (user.resetCode !== code) {
      return res.status(400).json({ valid: false, error: 'Código inválido.' });
    }

    if (new Date() > new Date(user.resetCodeExpiry)) {
      return res.status(400).json({ valid: false, error: 'Código expirado.' });
    }

    return res.status(200).json({ valid: true });
  } catch (error) {
    console.error('verifyResetCode error:', error);
    return res
      .status(500)
      .json({ error: 'Error interno al verificar el código.' });
  }
};

// Resetear la contraseña con el código
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res
        .status(400)
        .json({ error: 'Email, código y nueva contraseña son requeridos.' });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user || !user.resetCode || !user.resetCodeExpiry) {
      return res.status(400).json({ error: 'Código inválido o expirado.' });
    }

    if (user.resetCode !== code) {
      return res.status(400).json({ error: 'Código inválido.' });
    }

    if (new Date() > new Date(user.resetCodeExpiry)) {
      return res.status(400).json({ error: 'Código expirado.' });
    }

    // actualizar contraseña
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    // limpiar código
    user.resetCode = null;
    user.resetCodeExpiry = null;
    await user.save();

    // notificar al usuario
    try {
      await emailService.notifyPasswordChanged(user.email, user.name);
    } catch (emailError) {
      console.error('Error notificando cambio de contraseña:', emailError);
    }

    return res
      .status(200)
      .json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.error('resetPassword error:', error);
    return res
      .status(500)
      .json({ error: 'Error interno al cambiar la contraseña.' });
  }
};

// Cambio de contraseña para usuario autenticado
exports.changePassword = async (req, res) => {
  try {
    // Debug: validar que el middleware de auth haya poblado req.user
    console.log('changePassword middleware req.user ->', req.user);
    if (!req.user || !req.user.id) {
      console.warn('changePassword: req.user o req.user.id no definido');
      return res.status(401).json({ error: 'No autorizado.' });
    }

    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ error: 'Todos los campos son requeridos.' });
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ error: 'La nueva contraseña y la confirmación no coinciden.' });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    return res
      .status(200)
      .json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.error('changePassword error:', error);
    return res
      .status(500)
      .json({ error: 'Error interno al cambiar la contraseña.' });
  }
};

// notis de usuarios pendientes a ser solicitantes
exports.getPendingUsersCount = async (req, res) => {
  try {
    const count = await User.count({
      where: {
        role: 'pending', //
      },
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error('error en getPendingUsersCount:', error);
    res.status(500).json({
      error: 'Error al obtener el conteo de usuarios pendientes.',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

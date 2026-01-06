const { User } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { addToBlacklist } = require('../utils/blacklist');
const path = require('path');
const fs = require('fs').promises;
const emailService = require('../services/emailService');
require('dotenv').config();

// Controlador para crear un usuario normal
exports.createUser = async (req, res) => {
  try {
    let { name, email, password, ci } = req.body;
    email = email.toLowerCase();

    // Verificar si el correo ya está registrado
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'El correo ya está en uso.' });
    }

    // Crear un nuevo usuario utilizando el método estático
    const newUser = await User.createVisitor({
      name,
      email,
      password,
      ci,
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.warn(error);
    res.status(500).json({ error: 'Error al crear el usuario.' });
  }
};

// crear cualquier usuario
exports.createAnyUser = async (req, res) => {
  try {
    let { name, email, password, ci, role } = req.body;
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

    const existingUser2 = await User.findOne({ where: { ci } });
    if (existingUser2) {
      return res.status(400).json({ error: 'Cedula ya está en uso.' });
    }

    let newUser;

    // Crear usuario según el rol especificado
    switch (role) {
      case 'admin':
        newUser = await User.createAdmin({ name, email, password, ci });
        break;
      case 'coordinator':
        newUser = await User.createCoordinator({ name, email, password, ci });
        break;
      case 'requester':
        newUser = await User.createRequester({ name, email, password, ci });
        break;
      case 'visitor':
      case 'pending':
        newUser = await User.createVisitor({
          name,
          email,
          password,
          ci,
        });
        // Si es pending, actualizar el rol
        if (role === 'pending') {
          newUser = await newUser.update({ role: 'pending' });
        }
        break;
      default:
        return res.status(400).json({ error: 'Rol no válido.' });
    }

    // No retornar la contraseña en la respuesta
    const { password: _, ...userWithoutPassword } = newUser.toJSON();

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
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

// obtener usuaruos pending
exports.getPendingUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        role: 'pending',
      },
      attributes: ['id', 'name', 'email', 'ci', 'certificationPath'],
      order: [['createdAt', 'ASC']],
    });
    console.log('Usuarios pendientes encontrados:', users);
    // Si no se encuentran usuarios pendientes, devuelve un array vacío
    if (users.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(users);
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
    res.status(500).json({ error: 'Error al actualizar el usuario.' });
  }
};

// Eliminar un usuario
exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.destroy({
      where: { id: req.params.id },
    });

    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Usuario no encontrado.' });
    }
  } catch (error) {
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

    // Verificar si el usuario ya es REQUESTER o superior.
    if (user.role !== User.ROLES.VISITOR) {
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
    user.role = User.ROLES.PENDING;
    await user.save();

    //  notidicacion obtener admins y enviar correos
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
    });
  } catch (error) {
    console.error('Error al procesar la solicitud de certificación:', error);

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

    const filePath = user.certificationPath;

    // 1. Eliminar el archivo físico (si existe)
    if (filePath) {
      const absolutePath = path.join(process.cwd(), filePath);

      try {
        await fs.unlink(absolutePath); // Borrar el archivo
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

    await user.changeToVisitor();
    // notificacion al usuario rechazado
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
      message:
        'Solicitud rechazada con éxito. El archivo de certificación fue eliminado y el usuario volvió a ser Visitante (Visitor).',
      user: user,
    });
  } catch (error) {
    if (error.message.includes('Only pending users can apply.')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al rechazar la solicitud:', error);
    res
      .status(500)
      .json({ error: 'Error al procesar el rechazo de la solicitud.' });
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

// notis de usuarios pendientes a ser solicitantes
exports.getPendingUsersCount = async (req, res) => {
  try {
    console.log('getPendingUsersCount llamado para admin:', req.user.id);

    const count = await User.count({
      where: {
        role: 'pending', //
      },
    });

    console.log(`📊 Usuarios pendientes encontrados: ${count}`);
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

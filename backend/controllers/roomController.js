const {
  Room,
  User,
  CoordinatorDependencies,
  Dependency,
  DependencyRooms,
} = require('../models');
const {
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError,
} = require('sequelize');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs/promises');

// Función auxiliar para verificar permisos
const checkRoomPermission = async (userId, userRole, roomId) => {
  if (userRole === 'admin' || userRole === 'requester') {
    return true;
  }

  if (userRole === 'coordinator') {
    // obtener la(s) dependencia(s) a las que pertenece la sala
    const room = await Room.findByPk(roomId, {
      include: [
        {
          model: Dependency,
          as: 'dependencies',
          through: { attributes: [] },
        },
      ],
    });

    if (!room) return false;

    const dependencyIds = room.dependencies.map(d => d.id);
    if (dependencyIds.length === 0) return false;

    const permission = await CoordinatorDependencies.findOne({
      where: {
        UserId: userId,
        DependencyId: dependencyIds[0],
      },
    });

    return !!permission;
  }

  return false;
};

exports.checkRoomPermission = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'coordinator') {
      return res.json({ hasPermission: false });
    }

    const hasPermission = await checkRoomPermission(userId, userRole, roomId);
    res.json({ hasPermission });
  } catch (error) {
    console.error('Error checking room permission:', error);
    res.status(500).json({ error: 'Error verificando permisos' });
  }
};

exports.createRoom = async (req, res) => {
  const transaction = await Room.sequelize.transaction();
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    let roomData = req.body;

    // validar que se haya enviado una dependencia
    const { dependencyId } = roomData;
    if (!dependencyId) {
      return res
        .status(400)
        .json({ error: 'Se debe seleccionar una dependencia.' });
    }

    // verificar que exista la dependencia
    const dependency = await Dependency.findByPk(dependencyId);
    if (!dependency) {
      return res.status(400).json({ error: 'Dependencia no encontrada.' });
    }

    // si el usuario es coordinador, validar que tenga permiso sobre la dependencia
    if (userRole === 'coordinator') {
      const hasPerm = await CoordinatorDependencies.findOne({
        where: { UserId: userId, DependencyId: dependencyId },
      });
      if (!hasPerm) {
        return res.status(403).json({
          error: 'No tienes permisos para crear salas en esta dependencia.',
        });
      }
    }

    // Si se subió una imagen, agregar la ruta a los datos
    if (req.file) {
      roomData.imagePath = req.file.path;
    }

    const newRoom = await Room.create(roomData, { transaction });

    // crear la relación dependency - room
    await DependencyRooms.create(
      {
        DependencyId: dependencyId,
        RoomId: newRoom.id,
      },
      { transaction }
    );

    await transaction.commit();
    res.status(201).json(newRoom);
  } catch (error) {
    await transaction.rollback();

    // Si el error es un error de validación de Sequelize
    if (
      ['SequelizeValidationError', 'SequelizeUniqueConstraintError'].includes(
        error.name
      )
    ) {
      const validationErrors = error.errors.map(err => err.message);
      res.status(400).json({ errors: validationErrors });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Error al crear la sala.' });
    }
  }
};

exports.getRooms = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    console.log('Usuario autenticado:', { userId, userRole });

    let rooms;

    if (userRole === 'admin') {
      rooms = await Room.findAll({
        include: [
          {
            model: Dependency,
            as: 'dependencies',
            through: { attributes: [] },
          },
        ],
        order: [['name', 'ASC']],
      });
    } else if (userRole === 'coordinator') {
      // obtener dependencias que el coordinador maneja
      const coordDeps = await CoordinatorDependencies.findAll({
        where: { UserId: userId },
      });
      const dependencyIds = coordDeps.map(cd => cd.DependencyId);

      if (dependencyIds.length === 0) {
        rooms = [];
      } else {
        // buscar salas que pertenezcan a esas dependencias
        rooms = await Room.findAll({
          include: [
            {
              model: Dependency,
              as: 'dependencies',
              where: { id: dependencyIds },
              through: { attributes: [] },
            },
          ],
          order: [['name', 'ASC']],
        });
      }
    } else {
      rooms = await Room.findAll({
        include: [
          {
            model: Dependency,
            as: 'dependencies',
            through: { attributes: [] },
          },
        ],
      });
    }
    res.status(200).json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({
      error: 'Error al listar las salas.',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getRoomById = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    const roomId = req.params.id;

    // Verificar permisos
    const hasPermission = await checkRoomPermission(userId, userRole, roomId);
    if (!hasPermission) {
      return res.status(404).json({
        error: 'Sala no encontrada o no tienes permisos para acceder a ella.',
      });
    }

    const room = await Room.findByPk(roomId, {
      include: [
        { model: Dependency, as: 'dependencies', through: { attributes: [] } },
      ],
    });
    if (room) {
      res.status(200).json(room);
    } else {
      res.status(404).json({ error: 'Sala no encontrada.' });
    }
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Error al buscar la sala.' });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    const roomId = req.params.id;

    // Verificar permisos
    const hasPermission = await checkRoomPermission(userId, userRole, roomId);
    if (!hasPermission) {
      return res.status(404).json({
        error: 'Sala no encontrada o no tienes permisos para modificarla.',
      });
    }

    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Sala no encontrada.' });
    }

    // Si se subió una nueva imagen, eliminar la anterior y actualizar la ruta
    if (req.file) {
      // Eliminar imagen anterior si existe
      if (room.imagePath) {
        const absolutePath = path.join(process.cwd(), room.imagePath);
        try {
          await fs.unlink(absolutePath);
        } catch (fileError) {
          if (fileError.code !== 'ENOENT') {
            console.error(`Error al eliminar la imagen anterior: ${fileError}`);
          }
        }
      }
      req.body.imagePath = req.file.path;
    }

    // Si se cambia la dependencia asociada a la sala
    if (req.body.dependencyId) {
      const newDepId = req.body.dependencyId;
      const dep = await Dependency.findByPk(newDepId);
      if (!dep) {
        return res.status(400).json({ error: 'Dependencia no encontrada.' });
      }

      // Si el usuario es coordinador, validar permiso sobre la nueva dependencia
      if (userRole === 'coordinator') {
        const hasPerm = await CoordinatorDependencies.findOne({
          where: { UserId: userId, DependencyId: newDepId },
        });
        if (!hasPerm) {
          return res.status(403).json({
            error:
              'No tienes permisos para asignar esta dependencia a la sala.',
          });
        }
      }

      // borrar relaciones previas y crear la nueva relación (asumimos una dependencia por sala desde el frontend)
      await DependencyRooms.destroy({ where: { RoomId: room.id } });
      await DependencyRooms.create({ DependencyId: newDepId, RoomId: room.id });
      delete req.body.dependencyId; // no es columna directa en Room
    }

    await room.update(req.body);
    // volver a cargar relaciones
    const updated = await Room.findByPk(room.id, {
      include: [
        { model: Dependency, as: 'dependencies', through: { attributes: [] } },
      ],
    });
    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating room:', error);
    if (error instanceof UniqueConstraintError) {
      return res
        .status(409)
        .json({
          error: error.errors[0]?.message || 'Conflicto de integridad.',
        });
    }
    if (error instanceof ValidationError) {
      const messages = error.errors.map(e => e.message).join('; ');
      return res.status(400).json({ error: messages });
    }

    res.status(500).json({ error: 'Error al actualizar la sala.' });
  }
};

// Subir o reemplazar imagen de la sala
exports.uploadImage = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    const roomId = req.params.id;

    // Verificar permisos
    const hasPermission = await checkRoomPermission(userId, userRole, roomId);
    if (!hasPermission) {
      return res.status(404).json({
        error: 'Sala no encontrada o no tienes permisos para modificarla.',
      });
    }

    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Sala no encontrada.' });
    }

    // Si se subió una nueva imagen, actualizar la ruta
    if (req.file) {
      // Eliminar la imagen anterior si existe
      if (room.imagePath) {
        const absolutePath = path.join(process.cwd(), room.imagePath);
        try {
          await fs.unlink(absolutePath);
        } catch (fileError) {
          if (fileError.code !== 'ENOENT') {
            console.error(`Error al eliminar la imagen anterior: ${fileError}`);
          }
        }
      }
      room.imagePath = req.file.path;
      await room.save();
    }

    res.status(200).json(room);
  } catch (error) {
    console.error('Error uploading room image:', error);
    res.status(500).json({ error: 'Error al subir la imagen de la sala.' });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    const roomId = req.params.id;

    // Verificar permisos
    const hasPermission = await checkRoomPermission(userId, userRole, roomId);
    if (!hasPermission) {
      return res.status(404).json({
        error: 'Sala no encontrada o no tienes permisos para eliminarla.',
      });
    }

    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Sala no encontrada.' });
    }

    const imagePath = room.imagePath;

    const deleted = await Room.destroy({
      where: { id: roomId },
    });

    if (deleted) {
      if (imagePath) {
        // Construye la ruta absoluta
        const absolutePath = path.join(process.cwd(), imagePath);

        try {
          await fs.unlink(absolutePath); // borrar imagen
        } catch (fileError) {
          if (fileError.code === 'ENOENT') {
            console.warn(
              `Advertencia: Archivo no encontrado en el disco para la sala ${roomId}: ${absolutePath}`
            );
          } else {
            console.error(
              `Error al eliminar el archivo físico para la sala ${roomId}:`,
              fileError
            );
          }
        }
      }
      res.status(204).send();
    } else {
      res
        .status(404)
        .json({ error: 'Sala no encontrada después del intento de borrado.' });
    }
  } catch (error) {
    console.error('Error deleting room:', error);
    if (error instanceof ForeignKeyConstraintError) {
      return res.status(409).json({
        error:
          'No se puede eliminar la sala porque existen registros relacionados (p.ej. reservas o eventos). Elimine o reasigne esos registros antes de intentar eliminar.',
      });
    }
    if (error instanceof UniqueConstraintError) {
      return res
        .status(409)
        .json({
          error: error.errors[0]?.message || 'Conflicto de integridad.',
        });
    }
    if (error instanceof ValidationError) {
      const messages = error.errors.map(e => e.message).join('; ');
      return res.status(400).json({ error: messages });
    }

    res.status(500).json({ error: 'Error al eliminar la sala.' });
  }
};

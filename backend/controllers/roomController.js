const { Room, User, CoordinatorRooms } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs/promises');

// Función auxiliar para verificar permisos
const checkRoomPermission = async (userId, userRole, roomId) => {
  if (userRole === 'admin' || userRole === 'requester') {
    return true; // admins tienen acceso a todo
  }

  if (userRole === 'coordinator') {
    // si el coordinador tiene permisos sobre esta sala
    const permission = await CoordinatorRooms.findOne({
      where: {
        UserId: userId,
        RoomId: roomId,
      },
    });
    return !!permission; // retorna true si existe el permiso false si no
  }

  return false;
};

exports.createRoom = async (req, res) => {
  try {
    let roomData = req.body;

    // Si se subió una imagen, agregar la ruta a los datos
    if (req.file) {
      roomData.imagePath = req.file.path;
    }

    const newRoom = await Room.create(roomData);
    res.status(201).json(newRoom);
  } catch (error) {
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
        order: [['name', 'ASC']],
      });
    } else if (userRole === 'coordinator') {
      const userWithRooms = await User.findByPk(userId, {
        include: [
          {
            model: Room,
            as: 'managedRooms',
            through: { attributes: [] },
          },
        ],
      });

      rooms = userWithRooms ? userWithRooms.managedRooms : [];
    } else {
      rooms = await Room.findAll();
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

    const room = await Room.findByPk(roomId);
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

    // Si se subió una nueva imagen, actualizar la ruta
    if (req.file) {
      req.body.imagePath = req.file.path;
    }

    await room.update(req.body);
    res.status(200).json(room);
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ error: 'Error al actualizar la sala.' });
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
    res.status(500).json({ error: 'Error al eliminar la sala.' });
  }
};

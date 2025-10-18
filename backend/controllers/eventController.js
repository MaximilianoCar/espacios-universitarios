const { Event, User, CoordinatorRooms, Room } = require('../models');
const { Op } = require('sequelize');
const upload = require('../middlewares/eventFileUploadMiddleware');
const path = require('path');

// Función auxiliar para verificar permisos de sala
const checkRoomPermission = async (userId, userRole, roomId) => {
  if (userRole === 'admin') {
    return true;
  }

  if (userRole === 'coordinator') {
    const permission = await CoordinatorRooms.findOne({
      where: {
        UserId: userId,
        RoomId: roomId,
      },
    });
    return !!permission;
  }

  return false;
};

// Función auxiliar para obtener rooms permitidos
const getAllowedRoomIds = async (userId, userRole) => {
  if (userRole === 'admin') {
    const allRooms = await Room.findAll({ attributes: ['id'] });
    return allRooms.map(room => room.id);
  }

  if (userRole === 'coordinator') {
    const coordinatorRooms = await CoordinatorRooms.findAll({
      where: { UserId: userId },
      attributes: ['RoomId'],
    });
    return coordinatorRooms.map(cr => cr.RoomId);
  }

  return [];
};

// Crear un nuevo evento (Create)
exports.createEvent = async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      status: Event.STATUS.PENDING,
      userId: req.user.id,
    };

    if (req.file) {
      // Si se subió una imagen, agregar la ruta a los datos
      eventData.imagePath = req.file.path;
    }

    const newEvent = await Event.create(eventData);
    res.status(201).json(newEvent); // Responder con el nuevo evento creado
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el evento.' });
  }
};

// Obtener todos los eventos (Read - Get All)
exports.getAllEvents = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    let events;

    if (userRole === 'admin') {
      // admin ve todos los eventos
      events = await Event.findAll({
        include: [
          {
            model: Room,
            as: 'room',
          },
        ],
        order: [['createdAt', 'DESC']],
      });
    } else if (userRole === 'coordinator') {
      // coordinator ve solo eventos de salas que gestiona
      const allowedRoomIds = await getAllowedRoomIds(userId, userRole);

      if (allowedRoomIds.length > 0) {
        events = await Event.findAll({
          where: {
            roomId: {
              [Op.in]: allowedRoomIds,
            },
          },
          include: [
            {
              model: Room,
              as: 'room',
            },
          ],
          order: [['createdAt', 'DESC']],
        });
      } else {
        events = [];
      }
    } else {
      return res.status(403).json({
        message: 'No tienes permisos para realizar esta acción',
      });
    }

    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Error al obtener los eventos.' });
  }
};
// Obtener solo los eventos aprobados (para usuarios normales)
exports.getApprovedEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      where: { status: Event.STATUS.APPROVED },
      attributes: ['id', 'name', 'description', 'imagePath'],
    });

    res.status(200).json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los eventos aprobados.' });
  }
};

// Obtener un evento por ID (Read - Get One)
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.eventId); // Buscar evento por ID
    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado.' });
    }
    res.status(200).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el evento.' });
  }
};

// Actualizar un evento por ID (Update)
exports.updateEvent = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    const eventId = req.params.eventId;

    const event = await Event.findByPk(eventId, {
      include: [
        {
          model: Room,
          as: 'room',
        },
      ],
    });

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado.' });
    }

    // Verificar permisos según el rol
    if (userRole === 'user') {
      // Usuario solo puede editar sus propios eventos
      if (event.userId != userId) {
        return res.status(403).json({
          message: 'No tienes permisos para realizar esta acción',
        });
      }
    } else if (userRole === 'coordinator') {
      // coordinator necesita permisos sobre la sala del evento
      const hasPermission = await checkRoomPermission(
        userId,
        userRole,
        event.roomId
      );
      if (!hasPermission) {
        return res.status(403).json({
          message: 'No tienes permisos para modificar eventos de esta sala',
        });
      }
    } else if (userRole !== 'admin') {
      // admin acceso libre otros roles son rechazados
      return res.status(403).json({
        message: 'No tienes permisos para realizar esta acción',
      });
    }

    // Si se subió una nueva imagen, actualizar la ruta
    if (req.file) {
      req.body.imagePath = req.file.path;
    }

    await event.update(req.body);
    res.status(200).json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Error al actualizar el evento.' });
  }
};

// Eliminar un evento por ID (Delete)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.eventId); // Buscar el evento por ID
    if (req.user.role == User.ROLES.USER && event.userId != req.user.id) {
      return res
        .status(403)
        .json({ message: 'No tienes permisos para realizar esta acción' });
    }
    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado.' });
    }

    await event.destroy(); // Eliminar el evento
    res.status(204).json(); // Responder sin contenido
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el evento.' });
  }
};

// Controlador para subir archivos
exports.uploadFiles = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    const eventId = req.params.eventId;

    const event = await Event.findByPk(eventId, {
      include: [
        {
          model: Room,
          as: 'room',
        },
      ],
    });

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado.' });
    }

    // Verificar permisos según el rol
    if (userRole === 'requester') {
      // Usuario solo puede subir archivos a sus propios eventos
      if (event.userId != userId) {
        return res.status(403).json({
          message: 'No tienes permisos para realizar esta acción',
        });
      }
    } else if (userRole === 'coordinator') {
      // coordinator necesita permisos sobre la sala del evento
      const hasPermission = await checkRoomPermission(
        userId,
        userRole,
        event.roomId
      );
      if (!hasPermission) {
        return res.status(403).json({
          message:
            'No tienes permisos para subir archivos a eventos de esta sala',
        });
      }
    } else if (userRole !== 'admin') {
      // admin tiene acceso libre otros roles son rechazados
      return res.status(403).json({
        message: 'No tienes permisos para realizar esta acción',
      });
    }

    // Si se subieron los archivos, actualizar las rutas en el modelo
    if (req.files?.programPath) {
      event.programPath = req.files.programPath[0].path;
    }
    if (req.files?.agreementPath) {
      event.agreementPath = req.files.agreementPath[0].path;
    }

    await event.save();
    res.status(200).json({
      message: 'Archivos subidos y evento actualizado',
      event,
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: 'Error al subir los archivos.' });
  }
};

// Obtener todos los eventos asociados a un usuario por userId
exports.getEventsByUser = async (req, res) => {
  console.log(req.user);
  const userId = req.user.id;
  try {
    const events = await Event.findAll({
      where: {
        userId: userId,
      },
      include: [
        {
          model: Room,
          as: 'room',
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    if (!events || events.length === 0) {
      return res
        .status(404)
        .json({ error: 'No se encontraron eventos para este usuario.' });
    }

    res.status(200).json(events);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: 'Error al obtener los eventos del usuario.' });
  }
};

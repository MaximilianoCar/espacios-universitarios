const { Event, User, CoordinatorRooms, Room } = require('../models');
const { Op } = require('sequelize');
const upload = require('../middlewares/eventFileUploadMiddleware');
const path = require('path');
const emailService = require('../services/emailService');

// Normalizar rutas para usar slashes y eliminar prefijos como './' (compatibilidad Windows)
const normalizeFilePath = filePath => {
  if (!filePath) return filePath;
  // Reemplazar backslashes por slashes
  let p = filePath.replace(/\\/g, '/');
  p = p.replace(/^\.\//, '').replace(/^\//, '');
  return p;
};

// Eliminar un archivo seguro
const safeUnlink = async (relativePath, allowedSubPath) => {
  if (!relativePath) return;
  const normalized = normalizeFilePath(relativePath);
  const projectRoot = path.resolve(__dirname, '..');
  const fullPath = path.resolve(projectRoot, normalized);
  const allowedRoot = path.resolve(projectRoot, allowedSubPath);

  // Asegurar que el archivo esté dentro del directorio permitido
  if (!fullPath.startsWith(allowedRoot)) {
    console.warn(`Ruta de archivo no permitida para borrado: ${fullPath}`);
    return;
  }

  try {
    const fs = require('fs');
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      console.log(`Archivo eliminado: ${fullPath}`);
    }
  } catch (err) {
    console.error('Error al eliminar archivo:', err);
  }
};

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
      // Si se subió una imagen, agregar la ruta a los datos (normalizada)
      eventData.imagePath = normalizeFilePath(req.file.path);
    }

    const newEvent = await Event.create(eventData);

    // notificacion obteniendo los coordinadores especificos
    try {
      const coordinators = await getCoordinatorsByRoom(newEvent.roomId);
      const roomName = await getRoomName(newEvent.roomId);

      if (coordinators.length > 0) {
        const coordEmails = coordinators.map(coord => coord.email);
        const user = await User.findByPk(req.user.id);

        const eventDetails =
          newEvent.description || 'Sin descripción adicional';
        const fecha = newEvent.reservationFrom
          ? new Date(newEvent.reservationFrom).toLocaleString()
          : 'Fecha no especificada';

        await emailService.notifyReservationRequest(
          //enviar correo
          coordEmails,
          user.name,
          roomName,
          fecha,
          `Evento: ${newEvent.name} - ${eventDetails}`
        );

        console.log(
          `Notificaciones de reserva enviadas a ${coordinators.length} coordinadores de ${roomName}`
        );
      } else {
        console.log(`No se encontraron coordinadores para la sala ${roomName}`);
      }
    } catch (emailError) {
      console.error('Error enviando notificaciones de reserva:', emailError);
    }

    res.status(201).json(newEvent); // Responder con el nuevo evento creado
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el evento.' });
  }
};

// obtener coordinadores de una sala específica
const getCoordinatorsByRoom = async roomId => {
  try {
    const coordinatorRooms = await CoordinatorRooms.findAll({
      where: { RoomId: roomId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role'],
          where: { role: 'coordinator' },
        },
      ],
      attributes: [],
    });

    return coordinatorRooms.map(cr => ({
      id: cr.user.id,
      name: cr.user.name,
      email: cr.user.email,
    }));
  } catch (error) {
    console.error('Error obteniendo coordinadores de la sala:', error);
    return [];
  }
};

// nombre del espacio
const getRoomName = async roomId => {
  try {
    const room = await Room.findByPk(roomId, {
      attributes: ['id', 'name'],
    });
    return room ? room.name : `Sala ${roomId}`;
  } catch (error) {
    console.error('Error obteniendo nombre de la sala:', error);
    return `Sala ${roomId}`;
  }
};

// Obtener todos los eventos (Read - Get All)
exports.getAllEventsVieja = async (req, res) => {
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

// Obtener todos los eventos (Read - Get All)

exports.getAllEvents = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    // Parámetros de paginación
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 8;
    const offset = (page - 1) * pageSize;

    let events;
    let count;

    if (userRole === 'admin') {
      // Admin ve todos los eventos con paginación
      const result = await Event.findAndCountAll({
        include: [
          {
            model: Room,
            as: 'room',
          },
        ],
        limit: pageSize,
        offset: offset,
        order: [['createdAt', 'DESC']],
      });
      events = result.rows;
      count = result.count;
    } else if (userRole === 'coordinator') {
      // Coordinator ve solo eventos de salas que gestiona con paginación
      const allowedRoomIds = await getAllowedRoomIds(userId, userRole);

      if (allowedRoomIds.length > 0) {
        const result = await Event.findAndCountAll({
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
          limit: pageSize,
          offset: offset,
          order: [['createdAt', 'DESC']],
        });
        events = result.rows;
        count = result.count;
      } else {
        events = [];
        count = 0;
      }
    } else {
      return res.status(403).json({
        message: 'No tienes permisos para realizar esta acción',
      });
    }

    const totalPages = Math.ceil(count / pageSize);

    res.status(200).json({
      totalEvents: count,
      totalPages: totalPages,
      currentPage: page,
      events: events,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Error al obtener los eventos.' });
  }
};
// Obtener solo los eventos aprobados (para usuarios normales)
exports.getApprovedEvents = async (req, res) => {
  try {
    // Incluir las fechas necesarias para que el frontend pueda agrupar por día
    const events = await Event.findAll({
      where: { status: Event.STATUS.APPROVED },
      attributes: [
        'id',
        'name',
        'description',
        'imagePath',
        'eventFrom',
        'eventTo',
        'reservationFrom',
        'reservationTo',
        'roomId',
      ],
      include: [
        {
          model: Room,
          as: 'room',
          attributes: ['id', 'name'],
        },
      ],
      order: [['eventFrom', 'ASC']],
    });

    res.status(200).json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los eventos aprobados.' });
  }
};

// Obtener un evento por ID
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.eventId, {
      include: [
        {
          model: Room,
          as: 'room',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado.' });
    }

    // Incluir bandera isOwner para el frontend
    const isOwner = req.user && req.user.id && event.userId === req.user.id;

    // Crear la respuesta incluyendo la información de la sala
    const response = {
      ...event.toJSON(),
      isOwner,
      roomName: event.room ? event.room.name : null,
    };

    res.status(200).json(response);
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
    if (userRole === 'requester') {
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

    // guardar el estado anterior antes de actualizar
    const previousStatus = event.status;

    // Si se subió una nueva imagen, actualizar la ruta (normalizada)
    if (req.file) {
      // borrar imagen anterior si existía
      if (event.imagePath) {
        await safeUnlink(event.imagePath, './uploads/events/images');
      }
      req.body.imagePath = normalizeFilePath(req.file.path);
    }

    await event.update(req.body);

    if (req.body.status) {
      if (
        req.body.status === Event.STATUS.APPROVED ||
        req.body.status === Event.STATUS.DENIED
      ) {
        try {
          const user = await User.findByPk(event.userId);
          const roomName = await getRoomName(event.roomId);

          if (user) {
            const fecha = event.date
              ? new Date(event.date).toLocaleString()
              : 'Fecha no especificada';

            await emailService.notifyReservationResult(
              user.email,
              user.name,
              roomName,
              fecha,
              req.body.status === Event.STATUS.APPROVED,
              req.body.comments || ''
            );

            console.log(
              `Notificación de estado (${req.body.status}) enviada a: ${user.email}`
            );

            // Notificar a las entidades según el estado
            if (req.body.status === Event.STATUS.APPROVED) {
              try {
                await emailService.notifyAllEntitiesApproval(
                  roomName,
                  event.reservationFrom,
                  event.reservationTo,
                  event.eventFrom,
                  event.eventTo,
                  eventId,
                  event.name
                );
                console.log(
                  'Notificación de aprobación enviada a todas las entidades'
                );
              } catch (approvalError) {
                console.error(
                  'Error enviando notificación de aprobación a entidades:',
                  approvalError
                );
              }
            } else if (
              req.body.status === Event.STATUS.DENIED &&
              previousStatus === Event.STATUS.APPROVED
            ) {
              // solo enviar notificación de cancelación si el evento estaba previamente aprobado
              try {
                await emailService.notifyAllEntitiesCancellation(
                  roomName,
                  event.reservationFrom,
                  event.reservationTo,
                  event.eventFrom,
                  event.eventTo,
                  eventId,
                  event.name
                );
                console.log(
                  'Notificación de cancelación enviada a todas las entidades'
                );
              } catch (cancellationError) {
                console.error(
                  'Error enviando notificación de cancelación a entidades:',
                  cancellationError
                );
              }
            }
          }
        } catch (emailError) {
          console.error('Error enviando notificación de estado:', emailError);
        }
      }
    }

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
        {
          model: User,
          as: 'user', // Incluir el usuario creador del evento
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado.' });
    }

    // Verificar permisos según el rol
    if (userRole === 'requester') {
      if (event.userId != userId) {
        return res.status(403).json({
          message: 'No tienes permisos para realizar esta acción',
        });
      }
    } else if (userRole === 'coordinator') {
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
      return res.status(403).json({
        message: 'No tienes permisos para realizar esta acción',
      });
    }

    // guardar estado anterior de los archivos
    const previousProgramPath = event.programPath;
    const previousAgreementPath = event.agreementPath;

    // bandera para saber si hubo cambios
    let programChanged = false;
    let agreementChanged = false;

    // si se subieron los archivos, actualizar las rutas en el modelo
    if (req.files?.programPath) {
      const newProgramPath = normalizeFilePath(req.files.programPath[0].path);
      // verificar si es realmente un archivo nuevo
      if (!previousProgramPath || newProgramPath !== previousProgramPath) {
        // borrar archivo anterior si existía
        if (previousProgramPath) {
          await safeUnlink(previousProgramPath, './uploads/events');
        }
        event.programPath = newProgramPath;
        programChanged = true;
      }
    }

    if (req.files?.agreementPath) {
      const newAgreementPath = normalizeFilePath(
        req.files.agreementPath[0].path
      );
      if (
        !previousAgreementPath ||
        newAgreementPath !== previousAgreementPath
      ) {
        if (previousAgreementPath) {
          await safeUnlink(previousAgreementPath, './uploads/events');
        }
        event.agreementPath = newAgreementPath;
        agreementChanged = true;
      }
    }

    // solo guardar si hubo cambios reales
    if (programChanged || agreementChanged) {
      await event.save();
    }

    // notificaciones
    try {
      const currentUser = await User.findByPk(userId);
      const roomName = await getRoomName(event.roomId);
      const fecha = event.eventFrom
        ? new Date(event.eventFrom).toLocaleString()
        : 'Fecha no especificada';

      // notificacion si se sube programa
      if (programChanged && userRole === 'requester') {
        const coordinators = await getCoordinatorsByRoom(event.roomId);
        if (coordinators.length > 0) {
          const coordEmails = coordinators.map(coord => coord.email);
          await emailService.notifyProgramUploaded(
            coordEmails,
            currentUser.name,
            event.name,
            roomName,
            event.id
          );
          console.log(
            `Notificación de programa enviada a ${coordinators.length} coordinadores`
          );
        } else {
          console.log('No hay coordinadores para notificar sobre el programa');
        }
      }

      // notificacion si se sube contrato
      if (
        agreementChanged &&
        (userRole === 'coordinator' || userRole === 'admin') &&
        event.user
      ) {
        await emailService.notifyContractUploaded(
          event.user.email,
          event.user.name,
          event.name,
          roomName,
          fecha,
          event.id
        );
        console.log(`Notificación de contrato enviada a: ${event.user.email}`);
      }

      // validación
      if (
        programChanged &&
        (userRole === 'coordinator' || userRole === 'admin')
      ) {
        console.warn(
          `${userRole} subió un programa (solo requester debería hacer esto)`
        );
      }

      if (agreementChanged && userRole === 'requester') {
        console.warn(
          `Requester subió un contrato (solo coordinadores/admin deberían hacer esto)`
        );
      }
    } catch (emailError) {
      console.error('Error enviando notificaciones:', emailError);
    }

    // Preparar respuesta
    const response = {
      message: 'Archivos procesados correctamente',
      event: {
        id: event.id,
        name: event.name,
        updatedAt: event.updatedAt,
      },
    };

    // Incluir información específica de archivos solo si hubo cambios
    if (programChanged) {
      response.event.programPath = event.programPath;
      response.message += response.message.includes('correctamente')
        ? '. Programa actualizado'
        : 'Programa actualizado';
    }

    if (agreementChanged) {
      response.event.agreementPath = event.agreementPath;
      response.message += response.message.includes('actualizado')
        ? ' y contrato actualizado'
        : 'Contrato actualizado';
    }

    // Si no hubo cambios reales en archivos
    if (!programChanged && !agreementChanged) {
      response.message = 'No se detectaron cambios en los archivos';
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Error en uploadFiles:', error);

    // Manejar errores específicos de Multer
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'El archivo es demasiado grande. Tamaño máximo: 100MB.',
        });
      }
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: 'Campo de archivo inesperado.' });
      }
    }

    // Manejar errores de validación de tipo de archivo
    if (error.message === 'Tipo de archivo no permitido.') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Error al procesar los archivos.' });
  }
};

// Subir banner (opcional) para un evento y/o actualizar descripción
exports.uploadBanner = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado.' });
    }

    // Permisos: si el usuario es requester, solo puede modificar sus propios eventos
    if (req.user.role === 'requester' && event.userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: 'No tienes permisos para modificar este evento.' });
    }

    // Si se subió un banner, actualizar la ruta (normalizada) y borrar anterior
    if (req.file) {
      const newBannerPath = normalizeFilePath(req.file.path);
      // borrar banner anterior si existía y no era el default
      if (event.bannerPath) {
        await safeUnlink(event.bannerPath, './uploads/events/banners');
      }
      event.bannerPath = newBannerPath; // Guardar ruta relativa
    }

    // Permitir actualizar la descripción en la misma petición (opcional)
    if (req.body.description !== undefined) {
      event.description = req.body.description;
    }

    await event.save();
    res.status(200).json({ message: 'Banner/Descripción actualizados', event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al subir el banner.' });
  }
};

// Eliminar banner y restaurar comportamiento por defecto
exports.removeBanner = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado.' });
    }

    // permisos: solo requester (dueño), admin o coordinator pueden eliminar
    const userRole = req.user.role;
    const userId = req.user.id;
    if (userRole === 'requester' && event.userId !== userId) {
      return res
        .status(403)
        .json({ message: 'No tienes permisos para modificar este evento.' });
    }

    if (event.bannerPath) {
      await safeUnlink(event.bannerPath, './uploads/events/banners');
      event.bannerPath = null;
      await event.save();
    }

    res.status(200).json({ message: 'Banner eliminado', event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el banner.' });
  }
};

// Subir o reemplazar imagen principal del evento
exports.uploadEventImage = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado.' });

    // permisos: solo requester (dueño), admin o coordinator pueden modificar
    const userRole = req.user.role;
    const userId = req.user.id;
    if (userRole === 'requester' && event.userId !== userId) {
      return res
        .status(403)
        .json({ message: 'No tienes permisos para modificar este evento.' });
    }

    if (req.file) {
      const newImagePath = normalizeFilePath(req.file.path);
      if (event.imagePath) {
        await safeUnlink(event.imagePath, './uploads/events/images');
      }
      event.imagePath = newImagePath;
      await event.save();
    }

    res.status(200).json({ message: 'Imagen de evento actualizada', event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al subir la imagen del evento.' });
  }
};

// Eliminar imagen principal del evento
exports.removeEventImage = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado.' });

    const userRole = req.user.role;
    const userId = req.user.id;
    if (userRole === 'requester' && event.userId !== userId) {
      return res
        .status(403)
        .json({ message: 'No tienes permisos para modificar este evento.' });
    }

    if (event.imagePath) {
      await safeUnlink(event.imagePath, './uploads/events/images');
      event.imagePath = null;
      await event.save();
    }

    res.status(200).json({ message: 'Imagen del evento eliminada', event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la imagen del evento.' });
  }
};

// Obtener todos los eventos asociados a un usuario por userId
exports.getEventsByUserVieja = async (req, res) => {
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

// Obtener todos los eventos asociados a un usuario por userId
exports.getEventsByUser = async (req, res) => {
  console.log(req.user);
  const userId = req.user.id;

  // Parámetros de paginación
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 25;
  const offset = (page - 1) * pageSize;

  try {
    const { count, rows: events } = await Event.findAndCountAll({
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
      limit: pageSize,
      offset: offset,
      order: [['createdAt', 'DESC']],
    });

    if (!events || events.length === 0) {
      return res
        .status(404)
        .json({ error: 'No se encontraron eventos para este usuario.' });
    }

    const totalPages = Math.ceil(count / pageSize);

    res.status(200).json({
      totalEvents: count,
      totalPages: totalPages,
      currentPage: page,
      events: events,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: 'Error al obtener los eventos del usuario.' });
  }
};

// para notificaciones
exports.getPendingEventsCount = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    // Si no es admin o coordinator, retornar 0
    if (!['admin', 'coordinator'].includes(userRole)) {
      return res.status(200).json({ count: 0 });
    }

    let whereCondition = { status: 'pending' }; // Usar string directamente

    if (userRole === 'coordinator') {
      // Obtener las salas permitidas para el coordinador
      const allowedRoomIds = await getAllowedRoomIds(userId, userRole);

      if (!allowedRoomIds || allowedRoomIds.length === 0) {
        // Si no tiene salas asignadas, no hay eventos pendientes
        return res.status(200).json({ count: 0 });
      }

      whereCondition.roomId = { [Op.in]: allowedRoomIds };
    }

    const count = await Event.count({
      where: whereCondition,
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error('Error fetching pending events count:', error);
    res
      .status(500)
      .json({ error: 'Error al obtener el conteo de eventos pendientes.' });
  }
};

// para notis de card de requester
exports.getUserEventsCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('getUserEventsCount llamado para usuario:', userId);

    // solo los requesters pueden ver sus propios eventos
    if (userRole !== 'requester') {
      return res.status(403).json({
        error: 'No tienes permisos para acceder a esta información.',
      });
    }

    // contar eventos por estado para el usuario
    const approvedCount = await Event.count({
      where: {
        userId: userId,
        status: 'approved',
      },
    });

    const deniedCount = await Event.count({
      where: {
        userId: userId,
        status: 'denied',
      },
    });

    const pendingCount = await Event.count({
      where: {
        userId: userId,
        status: 'pending',
      },
    });

    const totalCount = await Event.count({
      where: {
        userId: userId,
      },
    });

    const result = {
      approved: approvedCount,
      denied: deniedCount,
      pending: pendingCount,
      total: totalCount,
    };

    console.log(`📊 Conteo de eventos para usuario ${userId}:`, result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error en getUserEventsCount:', error);
    res.status(500).json({
      error: 'Error al obtener el conteo de eventos del usuario.',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Eliminar agreement (contrato) de un evento
exports.removeAgreement = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userRole = req.user.role;
    const userId = req.user.id;

    const event = await Event.findByPk(eventId);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado.' });

    // permisos: solo admin o coordinator pueden eliminar el contrato
    if (userRole === 'requester') {
      return res
        .status(403)
        .json({ message: 'No tienes permisos para eliminar el contrato.' });
    }

    if (userRole === 'coordinator') {
      const hasPermission = await checkRoomPermission(
        userId,
        userRole,
        event.roomId
      );
      if (!hasPermission) {
        return res.status(403).json({
          message: 'No tienes permisos para eliminar el contrato de esta sala',
        });
      }
    }

    if (event.agreementPath) {
      await safeUnlink(event.agreementPath, './uploads/events');
      event.agreementPath = null;
      await event.save();
    }

    res.status(200).json({ message: 'Contrato eliminado', event });
  } catch (error) {
    console.error('Error removing agreement:', error);
    res.status(500).json({ error: 'Error al eliminar el contrato.' });
  }
};

// Eliminar program (programa) de un evento
exports.removeProgram = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userRole = req.user.role;
    const userId = req.user.id;

    const event = await Event.findByPk(eventId);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado.' });

    // permisos: requester puede eliminar su programa; admin/coordinator también pueden
    if (userRole === 'requester' && event.userId !== userId) {
      return res.status(403).json({
        message: 'No tienes permisos para eliminar el programa de este evento.',
      });
    }

    if (userRole === 'coordinator') {
      const hasPermission = await checkRoomPermission(
        userId,
        userRole,
        event.roomId
      );
      if (!hasPermission) {
        return res.status(403).json({
          message: 'No tienes permisos para eliminar el programa de esta sala',
        });
      }
    }

    if (event.programPath) {
      await safeUnlink(event.programPath, './uploads/events');
      event.programPath = null;
      await event.save();
    }

    res.status(200).json({ message: 'Programa eliminado', event });
  } catch (error) {
    console.error('Error removing program:', error);
    res.status(500).json({ error: 'Error al eliminar el programa.' });
  }
};

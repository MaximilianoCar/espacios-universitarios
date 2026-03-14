const {
  Event,
  EventSchedule,
  User,
  CoordinatorDependencies,
  Room,
  Invitation,
  Dependency,
  sequelize,
} = require('../models');
const { Op } = require('sequelize');
const upload = require('../middlewares/eventFileUploadMiddleware');
const path = require('path');
const emailService = require('../services/emailService');
const googleCalendarService = require('../services/googleCalendarService');

// Normalizar rutas para usar slashes y eliminar prefijos como './'
const normalizeFilePath = filePath => {
  if (!filePath) return filePath;
  // Reemplazar backslashes por slashes
  let p = filePath.replace(/\\/g, '/');
  p = p.replace(/^\.\//, '').replace(/^\//, '');
  return p;
};

// Enviar calificación de evento (por solicitante)
exports.submitRating = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const eventId = req.params.eventId;
    const {
      spaceConditionRating,
      staffTreatmentRating,
      reservationProcessRating,
      suggestion,
    } = req.body;

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado.' });
    }

    // Solo el creador o admin puede calificar este evento
    if (userRole !== 'admin' && event.userId !== userId) {
      return res
        .status(403)
        .json({ message: 'No autorizado para calificar este evento.' });
    }

    // Debe ser evento aprobado y ya ocurrido
    if (event.status !== Event.STATUS.APPROVED) {
      return res
        .status(400)
        .json({ message: 'Solo se pueden calificar eventos aprobados.' });
    }

    const now = new Date();
    if (new Date(event.eventTo) > now) {
      return res.status(400).json({ message: 'El evento aún no ha ocurrido.' });
    }

    // Validar rangos
    const min = Event.RATING.MIN;
    const max = Event.RATING.MAX;

    const toValidate = {
      spaceConditionRating,
      staffTreatmentRating,
      reservationProcessRating,
    };

    for (const [key, val] of Object.entries(toValidate)) {
      if (val != null) {
        const num = parseInt(val, 10);
        if (Number.isNaN(num) || num < min || num > max) {
          return res
            .status(400)
            .json({ message: `Valor inválido para ${key}` });
        }
      }
    }

    // Actualizar campos
    event.spaceConditionRating = spaceConditionRating;
    event.staffTreatmentRating = staffTreatmentRating;
    event.reservationProcessRating = reservationProcessRating;
    if (suggestion) {
      event.comments = event.comments
        ? `${event.comments}\n\nSugerencia de calificación: ${suggestion}`
        : `Sugerencia de calificación: ${suggestion}`;
    }

    await event.save();

    // Notificar a coordinadores del espacio
    try {
      const coordinators = await getCoordinatorsByRoom(event.roomId);
      const roomName = await getRoomName(event.roomId);
      const user = await User.findByPk(userId);

      if (coordinators && coordinators.length > 0) {
        const coordEmails = coordinators.map(c => c.email).filter(Boolean);
        await emailService.notifyEventRating(
          coordEmails,
          user ? user.name : 'Usuario',
          event.name,
          roomName,
          spaceConditionRating,
          staffTreatmentRating,
          reservationProcessRating,
          suggestion
        );
      }
    } catch (emailErr) {
      console.error('Error enviando email de calificación:', emailErr);
    }

    return res.status(200).json({ message: 'Calificación guardada', event });
  } catch (error) {
    console.error('Error en submitRating:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener invitaciones de un evento
exports.getInvitations = async (req, res) => {
  try {
    const { Invitation } = require('../models');
    const eventId = req.params.eventId;
    const invitations = await Invitation.findAll({ where: { eventId } });
    return res.status(200).json({ invitations });
  } catch (err) {
    console.error('Error getInvitations:', err);
    return res.status(500).json({ message: 'Error interno' });
  }
};

// Invitar por correos: añade/actualiza invitados en Google Calendar y guarda en tabla
exports.inviteEmails = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { Invitation, Event } = require('../models');
    const { eventId } = req.params;
    const { emails } = req.body; // array de correos

    if (!Array.isArray(emails) || emails.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'No hay correos para invitar.' });
    }

    const event = await Event.findByPk(eventId, { transaction });
    if (!event) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Evento no encontrado.' });
    }

    const googleLink = `https://calendar.google.com/calendar/embed?src=espaciosuniversitariosucv%40gmail.com&ctz=America%2FCaracas`;
    const now = new Date();

    // Array para almacenar resultados de envío de emails (para posible logging)
    const emailResults = [];

    // Recorrer y enviar emails
    for (const rawEmail of emails) {
      const e = rawEmail.trim().toLowerCase();

      // Enviar email (esto no es transaccional, no se puede deshacer)
      try {
        await emailService.sendEmail(e, 'invitation', [
          '', // recipientName opcional
          event.name || '',
          await getRoomName(event.roomId),
          event.description || '',
          event.eventFrom || null,
          event.eventTo || null,
          googleLink,
        ]);
        emailResults.push({ email: e, success: true });
      } catch (emailError) {
        console.error(`Error enviando email a ${e}:`, emailError);
        emailResults.push({
          email: e,
          success: false,
          error: emailError.message,
        });
        // Continuamos con el siguiente email, pero no guardamos en BD si falló el envío
        continue;
      }

      // upsert invitation record (solo si el email se envió correctamente)
      await Invitation.upsert(
        { eventId: event.id, email: e, lastSentAt: now },
        { transaction }
      );
    }

    // Confirmar la transacción (solo guarda las invitaciones de emails enviados exitosamente)
    await transaction.commit();

    // Verificar si hubo fallos en el envío
    const failedEmails = emailResults.filter(r => !r.success);
    if (failedEmails.length > 0) {
      return res.status(207).json({
        message: 'Algunas invitaciones no pudieron ser enviadas',
        sent: emailResults.filter(r => r.success).length,
        failed: failedEmails.map(r => r.email),
        details: 'Las invitaciones enviadas exitosamente fueron guardadas.',
      });
    }

    return res.status(200).json({
      message: 'Invitaciones enviadas y guardadas correctamente.',
      count: emails.length,
    });
  } catch (err) {
    // Si ocurre error, deshacer cambios en BD
    if (transaction) await transaction.rollback();

    console.error('Error inviteEmails:', err);
    return res
      .status(500)
      .json({ message: 'Error interno al procesar invitaciones.' });
  }
};

// Comprobar colisiones de horarios para un evento (considera schedules)
exports.checkConflicts = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { Event, EventSchedule } = require('../models');

    const event = await Event.findByPk(eventId, {
      include: [{ model: EventSchedule, as: 'schedules' }],
    });
    if (!event)
      return res.status(404).json({ message: 'Evento no encontrado.' });

    // Obtener schedules de eventos aprobados en la misma sala (excepto el actual)
    const schedules = await EventSchedule.findAll({
      where: {},
      include: [
        {
          model: Event,
          as: 'event',
          where: {
            roomId: event.roomId,
            status: Event.STATUS.APPROVED,
            id: { [require('sequelize').Op.ne]: event.id },
          },
          attributes: ['id', 'name', 'eventFrom', 'eventTo'],
        },
      ],
    });

    const conflicts = [];
    // For each schedule in the current event, check overlap with schedules
    for (const s of event.schedules) {
      const sFrom = new Date(s.eventFrom).getTime();
      const sTo = new Date(s.eventTo).getTime();
      for (const other of schedules) {
        const oFrom = new Date(other.eventFrom).getTime();
        const oTo = new Date(other.eventTo).getTime();
        // overlap if start < other.end && other.start < end
        if (sFrom < oTo && oFrom < sTo) {
          conflicts.push({
            eventId: other.event.id,
            eventName: other.event.name,
            scheduleId: other.id,
            overlapFrom: Math.max(sFrom, oFrom),
            overlapTo: Math.min(sTo, oTo),
          });
        }
      }
    }

    return res.status(200).json({ conflicts });
  } catch (err) {
    console.error('Error checking conflicts:', err);
    return res.status(500).json({ message: 'Error interno' });
  }
};

// Comprobar colisiones a partir de payload (útil para creación/edición antes de persistir)
exports.checkConflictsPayload = async (req, res) => {
  try {
    const { roomId, schedules = [], eventId = null } = req.body;
    const { EventSchedule, Event } = require('../models');

    if (!roomId) return res.status(400).json({ message: 'roomId requerido' });

    // Obtener schedules de eventos aprobados en la misma sala (excepto eventId si viene)
    const whereEvent = { roomId, status: Event.STATUS.APPROVED };
    if (eventId) whereEvent.id = { [require('sequelize').Op.ne]: eventId };

    const approvedSchedules = await EventSchedule.findAll({
      include: [
        {
          model: Event,
          as: 'event',
          where: whereEvent,
          attributes: ['id', 'name'],
        },
      ],
    });

    const conflicts = [];

    // schedules payload expected items with eventFrom/eventTo timestamps
    for (const s of schedules) {
      const sFrom = new Date(s.eventFrom).getTime();
      const sTo = new Date(s.eventTo).getTime();
      for (const other of approvedSchedules) {
        const oFrom = new Date(
          other.eventFrom || other.event.eventFrom || other.event.eventFrom
        ).getTime();
        const oTo = new Date(
          other.eventTo || other.event.eventTo || other.event.eventTo
        ).getTime();
        if (sFrom < oTo && oFrom < sTo) {
          conflicts.push({
            eventId: other.event.id,
            eventName: other.event.name,
            overlapFrom: Math.max(sFrom, oFrom),
            overlapTo: Math.min(sTo, oTo),
          });
        }
      }
    }

    return res.status(200).json({ conflicts });
  } catch (err) {
    console.error('Error checking conflicts payload:', err);
    return res.status(500).json({ message: 'Error interno' });
  }
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
  if (userRole === 'admin') return true;

  if (userRole === 'coordinator') {
    // obtener dependencias de la sala
    const room = await Room.findByPk(roomId, {
      include: [
        { model: Dependency, as: 'dependencies', through: { attributes: [] } },
      ],
    });
    if (!room) return false;
    const dependencyIds = room.dependencies.map(d => d.id);
    if (dependencyIds.length === 0) return false;

    const permission = await CoordinatorDependencies.findOne({
      where: { UserId: userId, DependencyId: dependencyIds[0] },
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
    const coordDeps = await CoordinatorDependencies.findAll({
      where: { UserId: userId },
    });
    const dependencyIds = coordDeps.map(cd => cd.DependencyId);
    if (dependencyIds.length === 0) return [];

    const rooms = await Room.findAll({
      include: [
        {
          model: Dependency,
          as: 'dependencies',
          where: { id: dependencyIds },
          through: { attributes: [] },
        },
      ],
      attributes: ['id'],
    });

    return rooms.map(r => r.id);
  }

  return [];
};

// Crear un nuevo evento
exports.createEvent = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    const roomId = req.body.roomId;

    // Verificar permisos si el usuario es coordinador
    if (userRole === 'coordinator') {
      const hasPermission = await checkRoomPermission(userId, userRole, roomId);
      if (!hasPermission) {
        return res.status(403).json({
          message: 'No tienes permisos para crear eventos en esta sala',
        });
      }
    }

    // Determinar el estado basado en el rol del usuario
    let eventStatus = Event.STATUS.PENDING;
    if (userRole === 'admin' || userRole === 'coordinator') {
      eventStatus = Event.STATUS.APPROVED;
    }

    const eventData = {
      ...req.body,
      status: eventStatus,
      userId: userId,
    };

    // Normalizar campos que deben ser strings (evitar que multer/cliente envíe arrays u objetos)
    if (Array.isArray(eventData.paymentMethod)) {
      eventData.paymentMethod = eventData.paymentMethod[0];
    } else if (
      eventData.paymentMethod &&
      typeof eventData.paymentMethod === 'object'
    ) {
      try {
        eventData.paymentMethod = JSON.stringify(eventData.paymentMethod);
      } catch (e) {
        eventData.paymentMethod = String(eventData.paymentMethod);
      }
    }

    // Sanitizar fechas: convertir cadenas inválidas a null
    const parseDateOrNull = val => {
      if (!val && val !== 0) return null;
      const d = new Date(val);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    // Intentar parsear schedules enviados en el body (puede venir como JSON string)
    let schedulesInput = req.body.schedules;
    if (typeof schedulesInput === 'string') {
      try {
        schedulesInput = JSON.parse(schedulesInput);
      } catch (parseErr) {
        schedulesInput = null;
      }
    }

    // Convertir fechas principales a Date o null
    eventData.eventFrom = parseDateOrNull(req.body.eventFrom);
    eventData.eventTo = parseDateOrNull(req.body.eventTo);
    eventData.reservationFrom = parseDateOrNull(req.body.reservationFrom);
    eventData.reservationTo = parseDateOrNull(req.body.reservationTo);

    // Si vienen schedules, intentar rellenar event/reservation bounds para cumplir restricciones NOT NULL en BD
    if (
      schedulesInput &&
      Array.isArray(schedulesInput) &&
      schedulesInput.length > 0
    ) {
      const parsed = schedulesInput.map(s => ({
        eventFrom: parseDateOrNull(s.eventFrom),
        eventTo: parseDateOrNull(s.eventTo),
        reservationFrom: parseDateOrNull(s.reservationFrom),
        reservationTo: parseDateOrNull(s.reservationTo),
      }));

      // Obtén mínimos y máximos ignorando nulls
      const eventFromDates = parsed.map(p => p.eventFrom).filter(d => d);
      const eventToDates = parsed.map(p => p.eventTo).filter(d => d);
      const reservationFromDates = parsed
        .map(p => p.reservationFrom)
        .filter(d => d);
      const reservationToDates = parsed
        .map(p => p.reservationTo)
        .filter(d => d);

      if (!eventData.eventFrom && eventFromDates.length > 0) {
        eventData.eventFrom = new Date(
          Math.min(...eventFromDates.map(d => d.getTime()))
        );
      }
      if (!eventData.eventTo && eventToDates.length > 0) {
        eventData.eventTo = new Date(
          Math.max(...eventToDates.map(d => d.getTime()))
        );
      }
      if (!eventData.reservationFrom && reservationFromDates.length > 0) {
        eventData.reservationFrom = new Date(
          Math.min(...reservationFromDates.map(d => d.getTime()))
        );
      }
      if (!eventData.reservationTo && reservationToDates.length > 0) {
        eventData.reservationTo = new Date(
          Math.max(...reservationToDates.map(d => d.getTime()))
        );
      }
    }

    // Si no vienen schedules y reservationFrom/To son null, usar eventFrom/eventTo como fallback
    if (!eventData.reservationFrom && eventData.eventFrom) {
      eventData.reservationFrom = eventData.eventFrom;
    }
    if (!eventData.reservationTo && eventData.eventTo) {
      eventData.reservationTo = eventData.eventTo;
    }

    if (req.file) {
      // Si se subió una imagen, agregar la ruta a los datos (normalizada)
      eventData.imagePath = normalizeFilePath(req.file.path);
    }

    // Usar transacción para crear evento y sus schedules si vienen
    const t = await sequelize.transaction();
    let newEvent;
    try {
      newEvent = await Event.create(eventData, { transaction: t });

      // Si el frontend envía un array `schedules` ya parseado anteriormente, crearlos asociados
      if (schedulesInput && Array.isArray(schedulesInput)) {
        const schedulesToCreate = schedulesInput.map(s => {
          const evFrom = parseDateOrNull(s.eventFrom);
          const evTo = parseDateOrNull(s.eventTo);
          const resFrom = parseDateOrNull(s.reservationFrom);
          const resTo = parseDateOrNull(s.reservationTo);

          // Derivar dateOnly, startTime, endTime y dayOfWeek a partir de eventFrom/eventTo si no vienen
          let dateOnly = null;
          let startTime = null;
          let endTime = null;
          let dayOfWeek = null;

          if (s.dateOnly) {
            dateOnly = s.dateOnly;
          } else if (evFrom) {
            dateOnly = evFrom.toISOString().split('T')[0];
          }

          if (s.startTime) {
            startTime = s.startTime;
          } else if (evFrom) {
            startTime = evFrom.toISOString().split('T')[1].slice(0, 8);
          }

          if (s.endTime) {
            endTime = s.endTime;
          } else if (evTo) {
            endTime = evTo.toISOString().split('T')[1].slice(0, 8);
          }

          if (typeof s.dayOfWeek !== 'undefined' && s.dayOfWeek !== null) {
            dayOfWeek = s.dayOfWeek;
          } else if (evFrom) {
            dayOfWeek = evFrom.getUTCDay();
          }

          return {
            eventId: newEvent.id,
            eventFrom: evFrom,
            eventTo: evTo,
            reservationFrom: resFrom,
            reservationTo: resTo,
            dateOnly,
            startTime,
            endTime,
            dayOfWeek,
          };
        });

        // Validar schedules antes de insertar (evitar NULLs en columnas NOT NULL)
        for (const sch of schedulesToCreate) {
          if (
            !sch.eventFrom ||
            !sch.eventTo ||
            !sch.reservationFrom ||
            !sch.reservationTo ||
            !sch.dateOnly ||
            !sch.startTime ||
            !sch.endTime ||
            typeof sch.dayOfWeek === 'undefined' ||
            sch.dayOfWeek === null
          ) {
            await t.rollback();
            return res.status(400).json({
              error:
                'Cada schedule debe incluir eventFrom, eventTo, reservationFrom, reservationTo, dateOnly, startTime, endTime y dayOfWeek válidos.',
            });
          }
        }

        // Crear los schedules en la misma transacción
        console.log(
          `Creating ${schedulesToCreate.length} schedules for Event ${newEvent.id}`
        );
        // log detalles limitados para no saturar
        schedulesToCreate.slice(0, 10).forEach((s, i) =>
          console.log(`schedule[${i}]:`, {
            eventFrom: s.eventFrom,
            eventTo: s.eventTo,
            dateOnly: s.dateOnly,
            startTime: s.startTime,
            dayOfWeek: s.dayOfWeek,
          })
        );
        await EventSchedule.bulkCreate(schedulesToCreate, { transaction: t });
      }

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }

    // Si el evento fue creado por un requester (estado PENDING), notificar a los coordinadores
    if (eventStatus === Event.STATUS.PENDING) {
      try {
        const coordinators = await getCoordinatorsByRoom(newEvent.roomId);
        const roomName = await getRoomName(newEvent.roomId);

        if (coordinators.length > 0) {
          const coordEmails = coordinators.map(coord => coord.email);
          const user = await User.findByPk(userId);

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
          console.log(
            `No se encontraron coordinadores para la sala ${roomName}`
          );
        }
      } catch (emailError) {
        console.error('Error enviando notificaciones de reserva:', emailError);
      }
    } else {
      // Si el evento fue creado por admin/coordinator (estado APPROVED), notificar al usuario creador
      try {
        const user = await User.findByPk(userId);
        const roomName = await getRoomName(newEvent.roomId);

        if (user && user.email) {
          const fecha = newEvent.eventFrom
            ? new Date(newEvent.eventFrom).toLocaleString()
            : 'Fecha no especificada';

          await emailService.notifyReservationResult(
            user.email,
            user.name,
            roomName,
            fecha,
            true, // Aprobado automáticamente
            `Evento creado directamente por ${
              userRole === 'admin' ? 'administrador' : 'coordinador'
            }`
          );

          console.log(
            `Notificación de aprobación automática enviada a: ${user.email}`
          );
        }
      } catch (emailError) {
        console.error(
          'Error enviando notificación de aprobación automática:',
          emailError
        );
      }

      // Notificar a las entidades sobre la aprobación automática
      try {
        const roomName = await getRoomName(newEvent.roomId);

        await emailService.notifyAllEntitiesApproval(
          roomName,
          newEvent.reservationFrom,
          newEvent.reservationTo,
          newEvent.eventFrom,
          newEvent.eventTo,
          newEvent.id,
          newEvent.name
        );

        console.log(
          'Notificación de aprobación automática enviada a todas las entidades'
        );
      } catch (approvalError) {
        console.error(
          'Error enviando notificación de aprobación automática a entidades:',
          approvalError
        );
      }
    }

    res.status(201).json(newEvent); // Responder con el nuevo evento creado

    // Crear eventos en Google Calendar en segundo plano (uno por schedule si existen)
    (async () => {
      try {
        // Solo crear en Google Calendar si el evento quedó aprobado
        if (newEvent.status !== Event.STATUS.APPROVED) {
          console.log(
            `Skipping Google Calendar creation for Event ${newEvent.id} because status is ${newEvent.status}`
          );
          return;
        }

        const roomName = await getRoomName(newEvent.roomId);
        const descriptionWithRoom = `${newEvent.description || ''}\n\nEspacio: ${roomName}`;

        // Si el frontend envió schedules, crear un evento en Google Calendar por cada schedule
        if (
          schedulesInput &&
          Array.isArray(schedulesInput) &&
          schedulesInput.length > 0
        ) {
          // obtener schedules creados
          const createdSchedules = await EventSchedule.findAll({
            where: { eventId: newEvent.id },
          });

          for (const sch of createdSchedules) {
            try {
              console.log(
                `Creating Google Calendar event for schedule ${sch.id} (Event ${newEvent.id}) from ${sch.eventFrom} to ${sch.eventTo}`
              );
              const gId = await googleCalendarService.createEvent({
                name: newEvent.name,
                description: descriptionWithRoom,
                eventFrom: sch.eventFrom,
                eventTo: sch.eventTo,
              });
              if (gId) {
                await sch.update({ googleEventId: gId });
                console.log(
                  `Google Calendar event created for schedule ${sch.id}: ${gId}`
                );

                // Si es el ÚNICO schedule, también guardar el ID en el Evento principal
                if (createdSchedules.length === 1) {
                  await Event.update(
                    { googleEventId: gId },
                    { where: { id: newEvent.id } }
                  );
                  console.log(
                    `Also saved googleEventId ${gId} to main Event ${newEvent.id} (single schedule case)`
                  );
                }
              } else {
                console.warn(
                  `Google Calendar returned no id for schedule ${sch.id}`
                );
              }
            } catch (err) {
              console.error('Error creating google event for schedule:', err);
            }
          }
        } else {
          // No schedules, crear evento único vinculado al Event
          const gId = await googleCalendarService.createEvent({
            name: newEvent.name,
            description: descriptionWithRoom,
            eventFrom: newEvent.eventFrom,
            eventTo: newEvent.eventTo,
          });
          if (gId) {
            await Event.update(
              { googleEventId: gId },
              { where: { id: newEvent.id } }
            );
            console.log(
              `Google Calendar event created for Event ${newEvent.id}: ${gId}`
            );
          }
        }
      } catch (err) {
        console.error('Background Google Calendar create failed:', err);
      }
    })();
  } catch (error) {
    console.error(error);

    // Manejar errores de validación de Sequelize
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message).join('; ');
      return res.status(400).json({ error: messages });
    }

    // Manejar errores de restricción única
    if (error.name === 'SequelizeUniqueConstraintError') {
      const messages = error.errors.map(e => e.message).join('; ');
      return res.status(409).json({ error: messages });
    }

    res.status(500).json({ error: 'Error al crear el evento.' });
  }
};

// obtener coordinadores de una sala específica
const getCoordinatorsByRoom = async roomId => {
  try {
    const room = await Room.findByPk(roomId, {
      include: [
        { model: Dependency, as: 'dependencies', through: { attributes: [] } },
      ],
    });
    if (!room) return [];

    const dependencyIds = room.dependencies.map(d => d.id);
    if (dependencyIds.length === 0) return [];

    const coordDeps = await CoordinatorDependencies.findAll({
      where: { DependencyId: dependencyIds },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role'],
          where: { role: 'coordinator' },
        },
      ],
    });

    const unique = {};
    coordDeps.forEach(cd => {
      if (cd.user && !unique[cd.user.id]) {
        unique[cd.user.id] = {
          id: cd.user.id,
          name: cd.user.name,
          email: cd.user.email,
        };
      }
    });

    return Object.values(unique);
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

    // Parámetros de paginación y búsqueda
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 25;
    const search = req.query.search || '';
    const offset = (page - 1) * pageSize;

    let events;
    let count;

    // Construir condiciones de búsqueda
    let whereConditions = {};
    let includeConditions = [
      {
        model: Room,
        as: 'room',
      },
      {
        model: User,
        as: 'user',
        attributes: ['name', 'email', 'companyName', 'companyRif'],
      },
      {
        model: EventSchedule,
        as: 'schedules',
      },
    ];

    // Aplicar filtro de búsqueda si existe
    if (search) {
      whereConditions = {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { contact: { [Op.like]: `%${search}%` } },
          { '$room.name$': { [Op.like]: `%${search}%` } },
          { '$user.name$': { [Op.like]: `%${search}%` } },
          { '$user.email$': { [Op.like]: `%${search}%` } },
        ],
      };
    }

    if (userRole === 'admin') {
      // Admin ve todos los eventos con paginación y búsqueda
      const result = await Event.findAndCountAll({
        where: whereConditions,
        include: includeConditions,
        distinct: true,
        col: 'id',
        limit: pageSize,
        offset: offset,
        order: [['createdAt', 'DESC']],
        subQuery: false,
      });
      events = result.rows;
      count = result.count;
    } else if (userRole === 'coordinator') {
      // Coordinator ve solo eventos de salas que gestiona con paginación y búsqueda
      const allowedRoomIds = await getAllowedRoomIds(userId, userRole);

      if (allowedRoomIds.length > 0) {
        // Combinar condiciones de búsqueda con restricción de salas permitidas
        const coordinatorWhere = {
          ...whereConditions,
          roomId: {
            [Op.in]: allowedRoomIds,
          },
        };

        const result = await Event.findAndCountAll({
          where: coordinatorWhere,
          include: includeConditions,
          distinct: true,
          col: 'id',
          limit: pageSize,
          offset: offset,
          order: [['createdAt', 'DESC']],
          subQuery: false,
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

    // Calcular el total de páginas
    const totalPages = Math.ceil(count / pageSize);

    res.status(200).json({
      totalEvents: count,
      totalPages: totalPages,
      currentPage: page,
      events: events,
    });
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message,
    });
  }
};
// Obtener solo los eventos aprobados (para usuarios normales)
exports.getApprovedEvents = async (req, res) => {
  try {
    // Obtener la fecha y hora actual
    const currentDate = new Date();

    const events = await Event.findAll({
      where: {
        status: Event.STATUS.APPROVED,
        // Solo eventos que NO hayan terminado (eventTo > fecha actual)
        eventTo: {
          [Op.gt]: currentDate,
        },
      },
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
        'capacity',
        'cost',
        'contact',
      ],
      include: [
        {
          model: Room,
          as: 'room',
          attributes: ['id', 'name'],
        },
        {
          model: EventSchedule,
          as: 'schedules',
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
        {
          model: EventSchedule,
          as: 'schedules',
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
  const transaction = await sequelize.transaction();

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
          model: EventSchedule,
          as: 'schedules',
        },
      ],
      transaction,
    });

    if (!event) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Evento no encontrado.' });
    }

    // Verificar permisos según el rol
    if (userRole === 'requester') {
      if (event.userId != userId) {
        await transaction.rollback();
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
        await transaction.rollback();
        return res.status(403).json({
          message: 'No tienes permisos para modificar eventos de esta sala',
        });
      }
    } else if (userRole !== 'admin') {
      await transaction.rollback();
      return res.status(403).json({
        message: 'No tienes permisos para realizar esta acción',
      });
    }

    // Determinar si el evento es recurrente (tiene múltiples schedules)
    const isRecurrent = event.schedules && event.schedules.length > 1;

    // Si es recurrente, no permitir cambios en las fechas principales
    if (isRecurrent) {
      const fechaFields = [
        'eventFrom',
        'eventTo',
        'reservationFrom',
        'reservationTo',
      ];
      const hasDateChanges = fechaFields.some(
        field =>
          req.body[field] &&
          new Date(req.body[field]).getTime() !==
            new Date(event[field]).getTime()
      );

      if (hasDateChanges) {
        await transaction.rollback();
        return res.status(400).json({
          error:
            'Los eventos recurrentes no permiten modificar sus fechas. Si necesitas cambiar las fechas, elimina el evento recurrente y crea uno nuevo.',
        });
      }
    }

    // guardar el estado anterior antes de actualizar
    const previousStatus = event.status;

    // Si se subió una nueva imagen, actualizar la ruta (normalizada)
    if (req.file) {
      if (event.imagePath) {
        // Nota: la eliminación de archivos NO es transaccional, pero el orden es seguro
        await safeUnlink(event.imagePath, './uploads/events/images');
      }
      req.body.imagePath = normalizeFilePath(req.file.path);
    }

    // Sanitizar fechas en actualización
    const parseDateOrNullUpdate = val => {
      if (!val && val !== 0) return null;
      const d = new Date(val);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    if (req.body) {
      ['eventFrom', 'eventTo', 'reservationFrom', 'reservationTo'].forEach(
        field => {
          if (field in req.body) {
            const parsed = parseDateOrNullUpdate(req.body[field]);
            if (parsed === null) delete req.body[field];
            else req.body[field] = parsed;
          }
        }
      );
    }

    // Actualizar el evento principal (DENTRO de la transacción)
    await event.update(req.body, { transaction });

    // Procesar schedules SOLO si no es un evento recurrente
    let schedulesInput = req.body.schedules;
    if (typeof schedulesInput === 'string') {
      try {
        schedulesInput = JSON.parse(schedulesInput);
      } catch (parseErr) {
        schedulesInput = null;
      }
    }

    // Para eventos recurrentes, NO modificar los schedules
    if (schedulesInput && !isRecurrent) {
      try {
        if (
          typeof schedulesInput === 'object' &&
          !Array.isArray(schedulesInput) &&
          (Array.isArray(schedulesInput.keep) ||
            Array.isArray(schedulesInput.removeIds))
        ) {
          // MODO: actualización parcial con keep/removeIds
          await processSchedulesPartialMode(
            event,
            schedulesInput,
            parseDateOrNullUpdate,
            transaction
          );
        } else if (Array.isArray(schedulesInput)) {
          // MODO: reemplazar todos los schedules
          await processSchedulesReplaceMode(
            event,
            schedulesInput,
            parseDateOrNullUpdate,
            transaction
          );
        }
      } catch (scheduleError) {
        await transaction.rollback();
        console.error('Error procesando schedules:', scheduleError);
        return res.status(500).json({
          error: 'Error al procesar los horarios del evento.',
          details: scheduleError.message,
        });
      }
    } else if (schedulesInput && isRecurrent) {
      console.log(
        `Evento recurrente detectado (ID: ${event.id}): ignorando actualización de schedules`
      );
    }

    // Enviar notificaciones si cambió el estado (esto no es transaccional)
    if (req.body.status) {
      await sendStatusNotifications(req, event, previousStatus, eventId);
    }

    // Confirmar la transacción principal
    await transaction.commit();

    // Responder al cliente
    res.status(200).json(event);

    // --- OPERACIONES EN SEGUNDO PLANO (fuera de la transacción) ---

    // Actualizar/crear/eliminar evento en Google Calendar en segundo plano
    (async () => {
      try {
        await updateGoogleCalendarForEvent(event, previousStatus);
      } catch (err) {
        console.error('Background Google Calendar update failed:', err);
      }
    })();
  } catch (error) {
    // Si ocurre error, deshacer cambios
    if (transaction) await transaction.rollback();

    console.error('Error updating event:', error);
    const { UniqueConstraintError, ValidationError } = require('sequelize');

    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({
        error: error.errors[0]?.message || 'Conflicto de integridad.',
      });
    }
    if (error instanceof ValidationError) {
      const messages = error.errors.map(e => e.message).join('; ');
      return res.status(400).json({ error: messages });
    }

    res.status(500).json({ error: 'Error al actualizar el evento.' });
  }
};

// Funciones auxiliares para updateEvent

async function processSchedulesPartialMode(
  event,
  schedulesInput,
  parseDate,
  transaction
) {
  const keep = Array.isArray(schedulesInput.keep) ? schedulesInput.keep : [];
  const removeIds = Array.isArray(schedulesInput.removeIds)
    ? schedulesInput.removeIds
        .map(id => Number(id))
        .filter(id => !Number.isNaN(id))
    : [];

  // Borrar schedules indicados
  if (removeIds.length > 0) {
    const schedulesToRemove = await EventSchedule.findAll({
      where: { id: removeIds, eventId: event.id },
      transaction,
    });

    // Recolectar googleEventId para borrado posterior (fuera de transacción)
    for (const os of schedulesToRemove) {
      if (os.googleEventId) {
        // Guardar en memoria para borrar después
        if (!global.scheduleGoogleIdsToDelete)
          global.scheduleGoogleIdsToDelete = [];
        global.scheduleGoogleIdsToDelete.push(os.googleEventId);
      }
    }

    await EventSchedule.destroy({
      where: { id: removeIds, eventId: event.id },
      transaction,
    });
  }

  const toCreate = [];

  // Procesar keeps
  for (const s of keep) {
    const evFrom = parseDate(s.eventFrom);
    const evTo = parseDate(s.eventTo);
    const resFrom = parseDate(s.reservationFrom);
    const resTo = parseDate(s.reservationTo);

    let dateOnly = s.dateOnly || null;
    let startTime = s.startTime || null;
    let endTime = s.endTime || null;
    let dayOfWeek = typeof s.dayOfWeek !== 'undefined' ? s.dayOfWeek : null;

    if (!dateOnly && evFrom) dateOnly = evFrom.toISOString().split('T')[0];
    if (!startTime && evFrom)
      startTime = evFrom.toISOString().split('T')[1].slice(0, 8);
    if (!endTime && evTo)
      endTime = evTo.toISOString().split('T')[1].slice(0, 8);
    if ((dayOfWeek === null || typeof dayOfWeek === 'undefined') && evFrom)
      dayOfWeek = evFrom.getUTCDay();

    if (s.id) {
      // actualizar si pertenece al evento
      const existing = await EventSchedule.findOne({
        where: { id: s.id, eventId: event.id },
        transaction,
      });
      if (existing) {
        await existing.update(
          {
            eventFrom: evFrom,
            eventTo: evTo,
            reservationFrom: resFrom,
            reservationTo: resTo,
            dateOnly,
            startTime,
            endTime,
            dayOfWeek,
          },
          { transaction }
        );
      }
    } else {
      toCreate.push({
        eventId: event.id,
        eventFrom: evFrom,
        eventTo: evTo,
        reservationFrom: resFrom,
        reservationTo: resTo,
        dateOnly,
        startTime,
        endTime,
        dayOfWeek,
      });
    }
  }

  // Validar nuevos antes de insertar
  for (const sch of toCreate) {
    if (
      !sch.eventFrom ||
      !sch.eventTo ||
      !sch.reservationFrom ||
      !sch.reservationTo ||
      !sch.dateOnly ||
      !sch.startTime ||
      !sch.endTime ||
      typeof sch.dayOfWeek === 'undefined' ||
      sch.dayOfWeek === null
    ) {
      throw new Error(
        'Cada schedule nuevo debe incluir eventFrom, eventTo, reservationFrom, reservationTo, dateOnly, startTime, endTime y dayOfWeek válidos.'
      );
    }
  }

  if (toCreate.length > 0) {
    await EventSchedule.bulkCreate(toCreate, { transaction });
  }
}

async function processSchedulesReplaceMode(
  event,
  schedulesInput,
  parseDate,
  transaction
) {
  // Eliminar schedules antiguos y sus googleEventIds
  const oldSchedules = await EventSchedule.findAll({
    where: { eventId: event.id },
    transaction,
  });

  for (const os of oldSchedules) {
    if (os.googleEventId) {
      if (!global.scheduleGoogleIdsToDelete)
        global.scheduleGoogleIdsToDelete = [];
      global.scheduleGoogleIdsToDelete.push(os.googleEventId);
    }
  }

  await EventSchedule.destroy({
    where: { eventId: event.id },
    transaction,
  });

  const schedulesToCreate = schedulesInput.map(s => {
    const evFrom = parseDate(s.eventFrom);
    const evTo = parseDate(s.eventTo);
    const resFrom = parseDate(s.reservationFrom);
    const resTo = parseDate(s.reservationTo);

    let dateOnly = s.dateOnly || null;
    let startTime = s.startTime || null;
    let endTime = s.endTime || null;
    let dayOfWeek = typeof s.dayOfWeek !== 'undefined' ? s.dayOfWeek : null;

    if (!dateOnly && evFrom) dateOnly = evFrom.toISOString().split('T')[0];
    if (!startTime && evFrom)
      startTime = evFrom.toISOString().split('T')[1].slice(0, 8);
    if (!endTime && evTo)
      endTime = evTo.toISOString().split('T')[1].slice(0, 8);
    if ((dayOfWeek === null || typeof dayOfWeek === 'undefined') && evFrom)
      dayOfWeek = evFrom.getUTCDay();

    return {
      eventId: event.id,
      eventFrom: evFrom,
      eventTo: evTo,
      reservationFrom: resFrom,
      reservationTo: resTo,
      dateOnly,
      startTime,
      endTime,
      dayOfWeek,
    };
  });

  // Validar
  for (const sch of schedulesToCreate) {
    if (
      !sch.eventFrom ||
      !sch.eventTo ||
      !sch.reservationFrom ||
      !sch.reservationTo ||
      !sch.dateOnly ||
      !sch.startTime ||
      !sch.endTime ||
      typeof sch.dayOfWeek === 'undefined' ||
      sch.dayOfWeek === null
    ) {
      throw new Error(
        'Cada schedule debe incluir eventFrom, eventTo, reservationFrom, reservationTo, dateOnly, startTime, endTime y dayOfWeek válidos.'
      );
    }
  }

  if (schedulesToCreate.length > 0) {
    await EventSchedule.bulkCreate(schedulesToCreate, { transaction });
  }
}

async function sendStatusNotifications(req, event, previousStatus, eventId) {
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

async function updateGoogleCalendarForEvent(event, previousStatus) {
  const roomName = await getRoomName(event.roomId);
  const descriptionWithRoom = `${event.description || ''}\n\nEspacio: ${roomName}`;

  // Caso 1: pasó de no-aprobado -> aprobado => crear en Google
  if (
    previousStatus !== Event.STATUS.APPROVED &&
    event.status === Event.STATUS.APPROVED
  ) {
    const schs = await EventSchedule.findAll({ where: { eventId: event.id } });
    if (schs && schs.length > 0) {
      for (const sch of schs) {
        try {
          const gId = await googleCalendarService.createEvent({
            name: event.name,
            description: descriptionWithRoom,
            eventFrom: sch.eventFrom,
            eventTo: sch.eventTo,
          });
          if (gId) await sch.update({ googleEventId: gId });
        } catch (err) {
          console.error(
            'Error creating google event for schedule on approve:',
            err
          );
        }
      }
    } else {
      try {
        const createdId = await googleCalendarService.createEvent({
          name: event.name,
          description: descriptionWithRoom,
          eventFrom: event.eventFrom,
          eventTo: event.eventTo,
        });
        if (createdId)
          await Event.update(
            { googleEventId: createdId },
            { where: { id: event.id } }
          );
      } catch (err) {
        console.error('Error creating google event on approve:', err);
      }
    }
    return;
  }

  // Caso 2: pasó de aprobado -> no-aprobado => borrar del calendario
  if (
    previousStatus === Event.STATUS.APPROVED &&
    event.status !== Event.STATUS.APPROVED
  ) {
    // Borrar google events asociados a schedules
    try {
      const schs = await EventSchedule.findAll({
        where: { eventId: event.id },
      });
      for (const sch of schs) {
        if (sch.googleEventId) {
          try {
            await googleCalendarService.deleteEvent(sch.googleEventId);
            await sch.update({ googleEventId: null });
          } catch (err) {
            console.error(
              'Error deleting google schedule event on status change:',
              err
            );
          }
        }
      }
    } catch (errSchDel) {
      console.error(
        'Error fetching schedules for google deletion on status change:',
        errSchDel
      );
    }

    // Borrar google event asociado al Event (sin schedules)
    if (event.googleEventId) {
      try {
        await googleCalendarService.deleteEvent(event.googleEventId);
        await Event.update(
          { googleEventId: null },
          { where: { id: event.id } }
        );
      } catch (err) {
        console.error('Error deleting google event on status change:', err);
      }
    }
    return;
  }

  // Caso 3: sigue aprobado => actualizar/crear según corresponda
  if (event.status === Event.STATUS.APPROVED) {
    const schs = await EventSchedule.findAll({ where: { eventId: event.id } });
    if (schs && schs.length > 0) {
      // Transferir googleEventId del evento principal si existe
      try {
        if (event.googleEventId) {
          const sorted = schs
            .slice()
            .sort((a, b) => new Date(a.eventFrom) - new Date(b.eventFrom));
          const first = sorted[0];
          if (first && !first.googleEventId) {
            await first.update({ googleEventId: event.googleEventId });
            await Event.update(
              { googleEventId: null },
              { where: { id: event.id } }
            );
            try {
              await googleCalendarService.updateEvent(
                first.googleEventId || event.googleEventId,
                {
                  name: event.name,
                  description: descriptionWithRoom,
                  eventFrom: first.eventFrom,
                  eventTo: first.eventTo,
                }
              );
            } catch (errUp) {
              console.error(
                'Error updating transferred google event metadata:',
                errUp
              );
            }
          }
        }
      } catch (transferErr) {
        console.error(
          'Error transferring Event.googleEventId to schedule:',
          transferErr
        );
      }

      for (const sch of schs) {
        try {
          if (sch.googleEventId) {
            await googleCalendarService.updateEvent(sch.googleEventId, {
              name: event.name,
              description: descriptionWithRoom,
              eventFrom: sch.eventFrom,
              eventTo: sch.eventTo,
            });
            console.log(`Google Calendar event updated for schedule ${sch.id}`);
          } else {
            const gId = await googleCalendarService.createEvent({
              name: event.name,
              description: descriptionWithRoom,
              eventFrom: sch.eventFrom,
              eventTo: sch.eventTo,
            });
            if (gId) await sch.update({ googleEventId: gId });
            console.log(
              `Google Calendar event created for schedule ${sch.id}: ${gId}`
            );
          }
        } catch (err) {
          console.error('Error updating/creating google schedule event:', err);
        }
      }
    } else {
      // Sin schedules: actualizar o crear el google event asociado al Event
      if (event.googleEventId) {
        try {
          await googleCalendarService.updateEvent(event.googleEventId, {
            name: event.name,
            description: descriptionWithRoom,
            eventFrom: event.eventFrom,
            eventTo: event.eventTo,
          });
          console.log(`Google Calendar event updated for Event ${event.id}`);
        } catch (err) {
          console.error('Error updating google event for Event:', err);
        }
      } else {
        try {
          const createdId = await googleCalendarService.createEvent({
            name: event.name,
            description: descriptionWithRoom,
            eventFrom: event.eventFrom,
            eventTo: event.eventTo,
          });
          if (createdId)
            await Event.update(
              { googleEventId: createdId },
              { where: { id: event.id } }
            );
          console.log(
            `Google Calendar event created for Event ${event.id}: ${createdId}`
          );
        } catch (err) {
          console.error(
            'Error creating google event for Event (approved):',
            err
          );
        }
      }
    }
  }
}

// Eliminar un evento por ID (Delete)
exports.deleteEvent = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const event = await Event.findByPk(req.params.eventId, { transaction });

    // Verificar si el evento existe
    if (!event) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Evento no encontrado.' });
    }

    // Verificar permisos
    if (req.user.role === 'requester' && event.userId != req.user.id) {
      await transaction.rollback();
      return res
        .status(403)
        .json({ message: 'No tienes permisos para realizar esta acción' });
    }

    // Antes de eliminar el evento, recolectar google IDs de schedules para borrado en GCal
    const scheduleGoogleIds = [];
    try {
      const schs = await EventSchedule.findAll({
        where: { eventId: event.id },
        transaction,
      });
      for (const s of schs) {
        if (s.googleEventId) scheduleGoogleIds.push(s.googleEventId);
      }
    } catch (err) {
      await transaction.rollback();
      console.error('Error fetching schedules before event delete:', err);
      return res
        .status(500)
        .json({ error: 'Error al obtener los horarios del evento.' });
    }

    // Eliminar invitaciones asociadas
    await Invitation.destroy({ where: { eventId: event.id }, transaction });
    const googleIdToDelete = event.googleEventId;
    await event.destroy({ transaction });
    await transaction.commit();
    res.status(204).json();

    // Eliminar de Google Calendar en segundo plano si existía
    (async () => {
      try {
        // borrar google id principal si existe
        if (googleIdToDelete) {
          await googleCalendarService.deleteEvent(googleIdToDelete);
          console.log(`Google Calendar event deleted: ${googleIdToDelete}`);
        }

        // borrar google events asociados a schedules
        for (const gid of scheduleGoogleIds) {
          try {
            await googleCalendarService.deleteEvent(gid);
            console.log(`Google Calendar schedule event deleted: ${gid}`);
          } catch (err) {
            console.error('Error deleting google schedule event:', err);
          }
        }
      } catch (err) {
        console.error('Background Google Calendar delete failed:', err);
      }
    })();
  } catch (error) {
    // Si ocurre error, deshacer cambios
    if (transaction) await transaction.rollback();

    console.error('Error deleting event:', error);
    const {
      ForeignKeyConstraintError,
      UniqueConstraintError,
      ValidationError,
    } = require('sequelize');

    if (error instanceof ForeignKeyConstraintError) {
      return res.status(409).json({
        error:
          'No se puede eliminar el evento porque existen registros relacionados. Elimine o reasigne esos registros antes de intentar eliminar.',
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

  // Parámetros de paginación y búsqueda
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 25;
  const search = req.query.search || '';
  const offset = (page - 1) * pageSize;

  try {
    // Construir condiciones de búsqueda
    let whereConditions = {
      userId: userId,
    };

    let includeConditions = [
      {
        model: Room,
        as: 'room',
        attributes: ['id', 'name'],
      },
      {
        model: EventSchedule,
        as: 'schedules',
      },
    ];

    // Si hay un término de búsqueda, agregar condiciones
    if (search) {
      whereConditions = {
        ...whereConditions,
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { contact: { [Op.like]: `%${search}%` } },
          { '$room.name$': { [Op.like]: `%${search}%` } },
        ],
      };
    }

    const { count, rows: events } = await Event.findAndCountAll({
      where: whereConditions,
      include: includeConditions,
      distinct: true,
      col: 'id',
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

    //console.log(`Conteo de eventos para usuario ${userId}:`, result);
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

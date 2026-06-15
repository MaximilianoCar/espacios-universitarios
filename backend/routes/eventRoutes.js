// /app/routes/eventRoutes.js

const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const protect = require('../middlewares/authMiddleware'); // Middleware de autenticación
const restrictTo = require('../middlewares/restrictTo'); //proteger act eventos

// Renombrar las importaciones para evitar conflictos
const uploadFiles = require('../middlewares/eventFileUploadMiddleware');
const uploadImages = require('../middlewares/eventImageUploadMiddleware');
const uploadBanner = require('../middlewares/eventBannerUploadMiddleware');

// Rutas para el CRUD

// Crear un nuevo evento con imagen
router.post(
  '/events',
  protect, //
  restrictTo('requester', 'admin', 'coordinator'),
  uploadFiles.fields([
    { name: 'imageFile', maxCount: 1 },
    { name: 'programPath', maxCount: 1 },
  ]),
  eventController.createEvent
);

// Obtener solo eventos aprobados (para usuarios normales) - pública
router.get('/events', eventController.getApprovedEvents);

// Rutas para admin: obtener todos los eventos (protegido)
router.get(
  '/admin/events',
  protect,
  restrictTo('admin', 'coordinator'),
  eventController.getAllEvents
);

// para las notificaciones
router.get(
  '/events/pending-count',
  protect,
  restrictTo('admin', 'coordinator'),
  eventController.getPendingEventsCount
);

router.get(
  '/events/user/count',
  protect,
  restrictTo('requester', 'admin', 'coordinator'),
  eventController.getUserEventsCount
);

// Obtener un evento por ID - pública
router.get('/events/:eventId', eventController.getEventById);

router.get('/events/my-event/:eventId', protect, eventController.getEventById);

// Actualizar un evento existente con imagen
router.put(
  '/events/:eventId',
  protect,
  restrictTo('admin', 'coordinator', 'requester'),
  uploadImages.single('imageFile'), // Nombre del campo de imagen en el formulario
  eventController.updateEvent
);

// Eliminar un evento por ID
router.delete(
  '/events/:eventId',
  protect,
  restrictTo('requester', 'admin', 'coordinator'),
  eventController.deleteEvent
);

// Obtener eventos por usuario
router.get(
  '/my-events',
  protect,
  restrictTo('requester', 'admin', 'coordinator'),
  eventController.getEventsByUser
);

// Rutas para la subida de archivos después de la creación del evento
router.post(
  '/events/:eventId/upload-files',
  protect, // Asegurar que la ruta esté protegida
  uploadFiles.fields([
    { name: 'programPath', maxCount: 1 },
    { name: 'agreementPath', maxCount: 1 },
  ]),
  eventController.uploadFiles
);

// Endpoint para que el solicitante envie calificaciones del evento
router.post(
  '/events/:eventId/rate',
  protect,
  restrictTo('requester', 'admin', 'coordinator'),
  eventController.submitRating
);

// Obtener invitaciones y enviar invitaciones (admin/coordinator/requester owner)
router.get(
  '/events/:eventId/invitations',
  protect,
  restrictTo('admin', 'coordinator', 'requester'),
  eventController.getInvitations
);

router.post(
  '/events/:eventId/invitations',
  protect,
  restrictTo('admin', 'coordinator', 'requester'),
  eventController.inviteEmails
);

// Comprobar colisiones antes de aprobar
router.get(
  '/events/:eventId/conflicts',
  protect,
  restrictTo('admin', 'coordinator'),
  eventController.checkConflicts
);

// Comprobar colisiones mediante payload (para crear/editar antes de persistir)
router.post(
  '/events/check-conflicts',
  protect,
  restrictTo('admin', 'coordinator', 'requester'),
  eventController.checkConflictsPayload
);

// Endpoint para que el frontend pida notificar a las entidades sobre un evento
router.post(
  '/events/:eventId/notify-entities',
  protect,
  restrictTo('admin', 'coordinator'),
  eventController.notifyEntitiesForEvent
);

// Subir banner opcional para el evento (carpeta uploads/events/banners)
router.post(
  '/events/:eventId/upload-banner',
  protect,
  uploadBanner.single('banner'),
  eventController.uploadBanner
);

// Subir o reemplazar imagen principal del evento
router.post(
  '/events/:eventId/upload-image',
  protect,
  uploadImages.single('image'),
  eventController.uploadEventImage
);

// Eliminar imagen principal del evento
router.delete(
  '/events/:eventId/image',
  protect,
  eventController.removeEventImage
);

// Eliminar banner (restaurar a default)
router.delete('/events/:eventId/banner', protect, eventController.removeBanner);

// Eliminar contrato (solo admin/coordinator)
router.delete(
  '/events/:eventId/agreement',
  protect,
  restrictTo('admin', 'coordinator'),
  eventController.removeAgreement
);

// Eliminar programa (requester dueño, admin o coordinador con permiso)
router.delete(
  '/events/:eventId/program',
  protect,
  restrictTo('requester', 'admin', 'coordinator'),
  eventController.removeProgram
);

module.exports = router;

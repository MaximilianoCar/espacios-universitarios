// /app/routes/eventRoutes.js

const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const protect = require('../middlewares/authMiddleware'); // Middleware de autenticación
const restrictTo = require('../middlewares/restrictTo'); //proteger act eventos

// Renombrar las importaciones para evitar conflictos
const uploadFiles = require('../middlewares/eventFileUploadMiddleware');
const uploadImages = require('../middlewares/eventImageUploadMiddleware');

// Rutas para el CRUD

// Crear un nuevo evento con imagen
router.post(
  '/events',
  protect, // Usar 'protect' en lugar de 'authMiddleware'
  uploadImages.single('imageFile'), // Nombre del campo de imagen en el formulario
  eventController.createEvent
);

// Obtener solo eventos aprobados (para usuarios normales)
router.get('/events', protect, eventController.getApprovedEvents);

// Rutas para admin: obtener todos los eventos (protegido)
router.get(
  '/admin/events',
  protect,
  restrictTo('admin'),
  eventController.getAllEvents
);

// Obtener un evento por ID
router.get('/events/:eventId', eventController.getEventById);

// Actualizar un evento existente con imagen
router.put(
  '/events/:eventId',
  protect,
  restrictTo('admin'),
  uploadImages.single('imageFile'), // Nombre del campo de imagen en el formulario
  eventController.updateEvent
);

// Eliminar un evento por ID
router.delete(
  '/events/:eventId',
  protect,
  restrictTo('admin'),
  eventController.deleteEvent
);

// Obtener eventos por usuario
router.get(
  '/my-events',
  protect,
  restrictTo('admin'),
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

module.exports = router;

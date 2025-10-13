// routes/roomRoutes.js
const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const protect = require('../middlewares/authMiddleware');
const restrictTo = require('../middlewares/restrictTo');
const upload = require('../middlewares/roomImageUploadMiddleware'); // Importar el middleware de subida de imágenes

// Rutas para el modelo Room

// Crear una nueva sala con imagen
router.post(
  '/rooms',
  protect,
  restrictTo('admin'),
  upload.single('image'), // Aplicar el middleware de subida de imagen
  roomController.createRoom
);

// Obtener todas las salas
router.get('/rooms', roomController.getRooms);

// Obtener una sala por ID
router.get('/rooms/:id', roomController.getRoomById);

// Actualizar una sala existente con imagen
router.put(
  '/rooms/:id',
  protect,
  restrictTo('admin'),
  upload.single('image'), // Aplicar el middleware de subida de imagen
  roomController.updateRoom
);

// Eliminar una sala
router.delete(
  '/rooms/:id',
  protect,
  restrictTo('admin'),
  roomController.deleteRoom
);

module.exports = router;

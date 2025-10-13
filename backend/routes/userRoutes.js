const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const protect = require('../middlewares/authMiddleware'); // Middleware de autenticación
const restrictTo = require('../middlewares/restrictTo'); // Middleware de restricción por rol

// Ruta para crear un usuario normal (registro público)
router.post('/users', userController.createUser);

// Ruta para crear un administrador (solo accesible por administradores autenticados)
router.post(
  '/users/admin',
  protect,
  restrictTo('admin'),
  userController.createAdmin
);

// Rutas protegidas para el modelo User
router.get('/users', protect, restrictTo('admin'), userController.getUsers);
router.get(
  '/users/:id',
  protect,
  restrictTo('admin'),
  userController.getUserById
);
router.put(
  '/users/:id',
  protect,
  restrictTo('admin'),
  userController.updateUser
);
router.delete(
  '/users/:id',
  protect,
  restrictTo('admin'),
  userController.deleteUser
);

// Ruta para iniciar sesión
router.post('/login', userController.login);

router.post('/logout', protect, userController.logout);

router.post('/refresh-token', userController.refreshToken);

module.exports = router;

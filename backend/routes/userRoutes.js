const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const permissionController = require('../controllers/permissionController');
const protect = require('../middlewares/authMiddleware'); // Middleware de autenticación
const restrictTo = require('../middlewares/restrictTo'); // Middleware de restricción por rol
const uploadCertification = require('../middlewares/uploadCertification'); //  middleware de Multer

// Ruta para crear un usuario normal (registro público)
router.post('/users', userController.createUser);

// Crear cualquier usuario
router.post(
  '/anyusers',
  protect,
  restrictTo('admin'),
  userController.createAnyUser
);

// Ruta para crear un administrador (solo accesible por administradores autenticados)
router.post(
  '/users/admin',
  protect,
  restrictTo('admin'),
  userController.createAdmin
);

//paaara notis de admin
router.get(
  '/users/pending-count',
  protect,
  restrictTo('admin'),
  userController.getPendingUsersCount
);

// Asegúrate de que esta ruta esté ANTES de rutas como '/users/:id'

// Rutas protegidas para el modelo User
router.get('/users', protect, restrictTo('admin'), userController.getUsers);
router.get(
  '/users/pending',
  protect,
  restrictTo('admin'),
  userController.getPendingUsers
);
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
router.post(
  '/users/request-upgrade',
  protect,
  uploadCertification.single('certificationDocument'),
  userController.requestUpgrade
);

// Rutas protegidas para la gestión de solicitudes pendientes
router.put(
  '/users/approve/:id',
  protect,
  restrictTo('admin'),
  userController.approveRequest
);
router.put(
  '/users/reject/:id',
  protect,
  restrictTo('admin'),
  userController.rejectRequest
);

// Ruta para iniciar sesión
router.post('/login', userController.login);

router.post('/logout', protect, userController.logout);

router.post('/refresh-token', userController.refreshToken);

// ----------------------------------------------------------------------
// RUTAS DE GESTIÓN DE PERMISOS (PARA ADMINISTRADORES)
// ----------------------------------------------------------------------

// obtener permisos de un usuario específico
router.get(
  '/users/:id/permissions',
  protect,
  restrictTo('admin'),
  permissionController.getUserPermissions
);

// actualizar/Asignar permisos de un usuario
router.put(
  '/users/:id/permissions',
  protect,
  restrictTo('admin'),
  permissionController.updatePermissions
);

module.exports = router;

const express = require('express');
const router = express.Router();
const entityController = require('../controllers/entityController');
const protect = require('../middlewares/authMiddleware');
const restrictTo = require('../middlewares/restrictTo');

// Rutas CRUD para entidades (solo admin)
router.get(
  '/entities',
  protect,
  restrictTo('admin'),
  entityController.getEntities
);
router.post(
  '/entities',
  protect,
  restrictTo('admin'),
  entityController.createEntity
);
router.get(
  '/entities/:id',
  protect,
  restrictTo('admin'),
  entityController.getEntityById
);
router.put(
  '/entities/:id',
  protect,
  restrictTo('admin'),
  entityController.updateEntity
);
router.delete(
  '/entities/:id',
  protect,
  restrictTo('admin'),
  entityController.deleteEntity
);

module.exports = router;

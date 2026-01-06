const express = require('express');
const router = express.Router();
const dependencyController = require('../controllers/dependencyController');
const authMiddleware = require('../middlewares/authMiddleware');

// todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/dependencies', dependencyController.getDependencies);
router.get('/dependencies/:id', dependencyController.getDependencyById);
router.post('/dependencies', dependencyController.createDependency);
router.put('/dependencies/:id', dependencyController.updateDependency);
router.delete('/dependencies/:id', dependencyController.deleteDependency);

module.exports = router;

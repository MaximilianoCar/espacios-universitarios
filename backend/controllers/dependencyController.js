const {
  Dependency,
  CoordinatorDependencies,
  DependencyRooms,
  Event,
} = require('../models');
const {
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError,
  Op,
} = require('sequelize');

exports.createDependency = async (req, res) => {
  const transaction = await Dependency.sequelize.transaction();
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { name, description } = req.body;

    if (!name)
      return res.status(400).json({ error: 'El nombre es requerido.' });

    // Validar que no exista otra dependencia con el mismo nombre (case-insensitive)
    const sequelize = Dependency.sequelize;
    const existing = await Dependency.findOne({
      where: sequelize.where(
        sequelize.fn('lower', sequelize.col('name')),
        name.toLowerCase()
      ),
    });

    if (existing) {
      await transaction.rollback();
      return res
        .status(409)
        .json({ error: 'Ya existe una dependencia con ese nombre.' });
    }

    const newDep = await Dependency.create(
      { name, description },
      { transaction }
    );

    // Si el creador es coordinador, asignarle permiso sobre la dependencia
    if (userRole === 'coordinator') {
      await CoordinatorDependencies.create(
        { UserId: userId, DependencyId: newDep.id },
        { transaction }
      );
    }

    await transaction.commit();
    res.status(201).json(newDep);
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating dependency:', error);
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({
        error: error.errors[0]?.message || 'Conflicto de integridad.',
      });
    }
    if (error instanceof ValidationError) {
      const messages = error.errors.map(e => e.message).join('; ');
      return res.status(400).json({ error: messages });
    }

    res.status(500).json({ error: 'Error al crear la dependencia.' });
  }
};

exports.getDependencies = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    if (userRole === 'coordinator') {
      const coordDeps = await CoordinatorDependencies.findAll({
        where: { UserId: userId },
      });
      const dependencyIds = coordDeps.map(cd => cd.DependencyId);
      const deps = await Dependency.findAll({
        where: { id: dependencyIds.length ? dependencyIds : [0] },
        order: [['name', 'ASC']],
      });
      return res.status(200).json(deps);
    }

    const deps = await Dependency.findAll({ order: [['name', 'ASC']] });
    res.status(200).json(deps);
  } catch (error) {
    console.error('Error fetching dependencies:', error);
    res.status(500).json({ error: 'Error al listar dependencias.' });
  }
};

exports.getDependencyById = async (req, res) => {
  try {
    const dep = await Dependency.findByPk(req.params.id);
    if (!dep)
      return res.status(404).json({ error: 'Dependencia no encontrada.' });

    const userRole = req.user.role;
    const userId = req.user.id;
    if (userRole === 'coordinator') {
      const hasPerm = await CoordinatorDependencies.findOne({
        where: { UserId: userId, DependencyId: dep.id },
      });
      if (!hasPerm) {
        return res.status(404).json({ error: 'Dependencia no encontrada.' });
      }
    }

    res.status(200).json(dep);
  } catch (error) {
    console.error('Error fetching dependency:', error);
    res.status(500).json({ error: 'Error al obtener la dependencia.' });
  }
};

exports.updateDependency = async (req, res) => {
  try {
    const dep = await Dependency.findByPk(req.params.id);
    if (!dep)
      return res.status(404).json({ error: 'Dependencia no encontrada.' });

    // Si el usuario es coordinador, validar que tenga permiso sobre la dependencia
    const userRole = req.user.role;
    const userId = req.user.id;
    if (userRole === 'coordinator') {
      const hasPerm = await CoordinatorDependencies.findOne({
        where: { UserId: userId, DependencyId: dep.id },
      });
      if (!hasPerm) {
        return res.status(403).json({
          error: 'No tienes permisos para modificar esta dependencia.',
        });
      }
    }

    const { name } = req.body;

    // Si se está actualizando el nombre, validar que no exista otra dependencia con el mismo nombre
    if (name && name.trim() !== '') {
      const sequelize = Dependency.sequelize;
      const existing = await Dependency.findOne({
        where: sequelize.where(
          sequelize.fn('lower', sequelize.col('name')),
          name.toLowerCase()
        ),
      });

      if (existing && existing.id !== dep.id) {
        return res
          .status(409)
          .json({ error: 'Ya existe una dependencia con ese nombre.' });
      }
    }

    await dep.update(req.body);
    res.status(200).json(dep);
  } catch (error) {
    console.error('Error updating dependency:', error);
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({
        error: error.errors[0]?.message || 'Conflicto de integridad.',
      });
    }
    if (error instanceof ValidationError) {
      const messages = error.errors.map(e => e.message).join('; ');
      return res.status(400).json({ error: messages });
    }

    res.status(500).json({ error: 'Error al actualizar la dependencia.' });
  }
};

exports.deleteDependency = async (req, res) => {
  const transaction = await Dependency.sequelize.transaction();
  try {
    const dep = await Dependency.findByPk(req.params.id, { transaction });
    if (!dep) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Dependencia no encontrada.' });
    }

    // Si el usuario es coordinador, validar que tenga permiso sobre la dependencia
    const userRole = req.user.role;
    const userId = req.user.id;
    if (userRole === 'coordinator') {
      const hasPerm = await CoordinatorDependencies.findOne({
        where: { UserId: userId, DependencyId: dep.id },
        transaction,
      });
      if (!hasPerm) {
        await transaction.rollback();
        return res.status(403).json({
          error: 'No tienes permisos para eliminar esta dependencia.',
        });
      }
    }

    // Obtener rooms asociadas a la dependencia
    const depRooms = await DependencyRooms.findAll({
      where: { DependencyId: dep.id },
      transaction,
    });
    const roomIds = depRooms.map(dr => dr.RoomId).filter(Boolean);

    // Si alguna sala tiene eventos/reservas, impedir eliminación e informar al front
    if (roomIds.length > 0) {
      const eventsCount = await Event.count({
        where: { roomId: { [Op.in]: roomIds } },
        transaction,
      });

      if (eventsCount > 0) {
        await transaction.rollback();
        return res.status(409).json({
          error:
            'No se puede eliminar la dependencia porque existen solicitudes/reservas asociadas a uno o más espacios. Elimine primero esas solicitudes si desea borrar la dependencia.',
        });
      }
    }

    // Eliminar permisos/relaciones y luego la dependencia
    await CoordinatorDependencies.destroy({
      where: { DependencyId: dep.id },
      transaction,
    });
    await DependencyRooms.destroy({
      where: { DependencyId: dep.id },
      transaction,
    });
    await dep.destroy({ transaction });

    await transaction.commit();
    res.status(204).send();
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting dependency:', error);
    if (error instanceof ForeignKeyConstraintError) {
      return res.status(409).json({
        error:
          'No se puede eliminar la dependencia porque existen registros relacionados (p.ej. salas o permisos). Elimine o reasigne esos registros antes de intentar eliminar.',
      });
    }
    if (error instanceof UniqueConstraintError) {
      return res
        .status(409)
        .json({
          error: error.errors[0]?.message || 'Conflicto de integridad.',
        });
    }
    if (error instanceof ValidationError) {
      const messages = error.errors.map(e => e.message).join('; ');
      return res.status(400).json({ error: messages });
    }

    res.status(500).json({ error: 'Error al eliminar la dependencia.' });
  }
};

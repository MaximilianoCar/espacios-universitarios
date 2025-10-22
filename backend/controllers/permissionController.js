const { User, Room } = require('../models');

// Función auxiliar para verificar si el usuario es un administrador o coordinador
const isPermittedRole = role => role === 'admin' || role === 'coordinator';

/**
 * GET /users/:id/permissions
 */
exports.getUserPermissions = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      // Incluimos las managedRooms (las salas que ya administra)
      include: [
        {
          model: Room,
          as: 'managedRooms',
          attributes: ['id', 'name'],
        },
      ],
      attributes: ['id', 'name', 'role'],
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (!isPermittedRole(user.role)) {
      // No hay permisos para gestionar, pero devolvemos un array vacío de managedRooms
      return res.status(200).json({
        user: user,
        managedRooms: [],
        message: 'El usuario no tiene un rol gestionable para permisos.',
      });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error al obtener los permisos del usuario:', error);
    res.status(500).json({ error: 'Error interno al cargar los permisos.' });
  }
};

/**
 * PUT /users/:id/permissions
 */
exports.updatePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    // Esperamos un array de IDs de salas en el cuerpo de la solicitud
    const { roomIds } = req.body;

    if (!Array.isArray(roomIds)) {
      return res.status(400).json({
        error: 'El cuerpo de la solicitud debe contener un array de roomIds.',
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (!isPermittedRole(user.role)) {
      return res.status(403).json({
        error:
          'Solo se pueden asignar permisos a administradores y coordinadores.',
      });
    }

    await user.setManagedRooms(roomIds);

    res.status(200).json({
      message: `Permisos de salas actualizados con éxito para ${user.name}.`,
    });
  } catch (error) {
    console.error('Error al actualizar los permisos:', error);
    res
      .status(500)
      .json({ error: 'Error interno al actualizar los permisos.' });
  }
};

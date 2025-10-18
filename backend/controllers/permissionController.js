const { User, Room } = require('../models');

// Función auxiliar para verificar si el usuario es un administrador o coordinador
const isPermittedRole = role => role === 'admin' || role === 'coordinator';

/**
 * GET /users/:id/permissions
 * Obtiene el usuario y las salas que administra, incluyendo TODAS las salas disponibles.
 */
exports.getUserPermissions = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Obtener el usuario y sus salas administradas
    const user = await User.findByPk(id, {
      // Incluimos las managedRooms (las salas que ya administra)
      include: [
        {
          model: Room,
          as: 'managedRooms',
          attributes: ['id', 'name'], // Solo necesitamos ID y nombre de las salas
        },
      ],
      attributes: ['id', 'name', 'role'], // Datos básicos del usuario
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // 2. Opcional: Validar el rol del usuario que se está gestionando
    if (!isPermittedRole(user.role)) {
      // No hay permisos para gestionar, pero devolvemos un array vacío de managedRooms
      return res.status(200).json({
        user: user,
        managedRooms: [],
        message: 'El usuario no tiene un rol gestionable para permisos.',
      });
    }

    // 3. Respuesta
    res.status(200).json(user); // Sequelize devuelve el objeto user con managedRooms incluido
  } catch (error) {
    console.error('Error al obtener los permisos del usuario:', error);
    res.status(500).json({ error: 'Error interno al cargar los permisos.' });
  }
};

/**
 * PUT /users/:id/permissions
 * Asigna y revoca permisos. Reemplaza la lista actual de salas administradas.
 */
exports.updatePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    // Esperamos un array de IDs de salas en el cuerpo de la solicitud
    const { roomIds } = req.body;

    if (!Array.isArray(roomIds)) {
      return res
        .status(400)
        .json({
          error: 'El cuerpo de la solicitud debe contener un array de roomIds.',
        });
    }

    // 1. Encontrar el usuario
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // 2. Validar que el usuario tenga un rol que pueda administrar salas
    if (!isPermittedRole(user.role)) {
      return res
        .status(403)
        .json({
          error:
            'Solo se pueden asignar permisos a administradores y coordinadores.',
        });
    }

    // 3. Asignar/Revocar Permisos (El poder de Sequelize Many-to-Many)
    // El método setManagedRooms(roomIds) realiza 3 acciones atómicas:
    // a) Elimina todas las entradas existentes en CoordinatorRooms para este UserId.
    // b) Inserta nuevas entradas en CoordinatorRooms para cada RoomId en el array.
    // c) Si roomIds es un array vacío, simplemente elimina todos los permisos.
    await user.setManagedRooms(roomIds);

    res
      .status(200)
      .json({
        message: `Permisos de salas actualizados con éxito para ${user.name}.`,
      });
  } catch (error) {
    console.error('Error al actualizar los permisos:', error);
    res
      .status(500)
      .json({ error: 'Error interno al actualizar los permisos.' });
  }
};

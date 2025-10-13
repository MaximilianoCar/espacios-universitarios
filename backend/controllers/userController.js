const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { addToBlacklist } = require('../utils/blacklist');
require('dotenv').config();

// Controlador para crear un usuario normal
exports.createUser = async (req, res) => {
  try {
    let { name, email, password, ci } = req.body;
    email = email.toLowerCase();

    // Verificar si el correo ya está registrado
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'El correo ya está en uso.' });
    }

    // Crear un nuevo usuario utilizando el método estático
    const newUser = await User.createUser({
      name,
      email,
      password,
      ci,
    });

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el usuario.' });
  }
};

// Controlador para crear un administrador
exports.createAdmin = async (req, res) => {
  try {
    let { name, email, password } = req.body;
    email = email.toLowerCase();

    // Verificar si el correo ya está registrado
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'El correo ya está en uso.' });
    }

    // Crear un nuevo administrador utilizando el método estático
    const newAdmin = await User.createAdmin({
      name,
      email,
      password,
    });

    res.status(201).json(newAdmin);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el administrador.' });
  }
};

// Obtener todos los usuarios
exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar los usuarios.' });
  }
};

// Obtener un usuario por ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ error: 'Usuario no encontrado.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar el usuario.' });
  }
};

// Actualizar un usuario
exports.updateUser = async (req, res) => {
  try {
    const { name, email, status } = req.body;

    const [updated] = await User.update(req.body, {
      where: { id: req.params.id },
    });

    if (updated) {
      const updatedUser = await User.findByPk(req.params.id);
      res.status(200).json(updatedUser);
    } else {
      res.status(404).json({ error: 'Usuario no encontrado.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el usuario.' });
  }
};

// Eliminar un usuario
exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.destroy({
      where: { id: req.params.id },
    });

    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Usuario no encontrado.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el usuario.' });
  }
};

// Iniciar sesión y generar JWT + Refresh Token
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.toLowerCase();
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Contraseña incorrecta.' });
    }

    // Generar el token de acceso
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Generar el refresh token
    const refreshToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' } // Por ejemplo, 7 días
    );

    // Guardar el refresh token en la base de datos
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      data: {
        name: user.name,
        role: user.role,
        token,
        refreshToken, // Enviamos el refresh token al cliente
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error al iniciar sesión.' });
  }
};

//loguot
exports.logout = async (req, res) => {
  try {
    // Obtener el token del request protect
    const token = req.headers.authorization.split(' ')[1];

    // Decodificar para obtener la expiración
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.exp) {
      return res
        .status(400)
        .json({ error: 'Token inválido o sin expiración.' });
    }

    addToBlacklist(token, decoded.exp);

    res.status(200).json({
      message: 'Cierre de sesión exitoso. El token ha sido invalidado.',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error al cerrar sesión.' });
  }
};

// Endpoint para renovar el token de acceso
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(403).json({ error: 'Refresh token es requerido.' });
  }

  try {
    // Verificar el refresh token
    const user = await User.findOne({ where: { refreshToken } });
    if (!user) {
      return res.status(403).json({ error: 'Refresh token no es válido.' });
    }

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err) {
          return res.status(403).json({ error: 'Refresh token ha expirado.' });
        }

        // Generar un nuevo token de acceso
        const newAccessToken = jwt.sign(
          { id: user.id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        res.status(200).json({
          token: newAccessToken,
        });
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error al renovar el token.' });
  }
};

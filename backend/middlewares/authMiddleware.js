const jwt = require('jsonwebtoken');
require('dotenv').config();
const { isBlacklisted } = require('../utils/blacklist');

async function protect(req, res, next) {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: 'No autorizado, token no encontrado' });
  }

  if (isBlacklisted(token)) {
    //logica del revisar blacklist
    return res
      .status(401)
      .json({ message: 'Token revocado. Por favor, inicie sesión de nuevo.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Agregar el usuario decodificado al request
    next();
  } catch (error) {
    // Maneja errores de expiración y firma inválida
    return res.status(401).json({ message: 'Token no válido' });
  }
}

module.exports = protect;

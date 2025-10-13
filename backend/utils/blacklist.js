const tokenBlacklist = [];

exports.addToBlacklist = (token, exp) => {
  // Convertir la expiración de segundos a milisegundos JS
  const expiresAt = exp * 1000;
  tokenBlacklist.push({ token, expiresAt });

  // Limpiar la lista de tokens expirados periódicamente para evitar crecimiento excesivo
  const now = Date.now();
  const delay = expiresAt - now > 0 ? expiresAt - now : 0;

  setTimeout(() => {
    const index = tokenBlacklist.findIndex(item => item.token === token);
    if (index !== -1) {
      tokenBlacklist.splice(index, 1);
    }
  }, delay);
};

exports.isBlacklisted = token => {
  return tokenBlacklist.some(item => item.token === token);
};

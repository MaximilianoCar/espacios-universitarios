function restrictTo(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: 'No tienes permisos para realizar esta acción' });
    }
    next();
  };
}

module.exports = restrictTo;

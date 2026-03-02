import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, adminOnly = false, allowedRoles = [] }) => {
  const { role, isAuthenticated } = useSelector(state => state.auth);

  // Si el usuario no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ADMIN: tiene acceso a TODO (prioridad máxima)
  if (role === 'admin') {
    return children;
  }

  // Si se especificaron roles permitidos, verificar
  if (allowedRoles.length > 0) {
    if (allowedRoles.includes(role)) {
      return children;
    }
    return <Navigate to="/home" replace />;
  }

  // Si es solo para admin/coord y el usuario no tiene esos roles
  if (adminOnly && role !== 'admin' && role !== 'coordinator') {
    return <Navigate to="/home" replace />;
  }

  // Para COORDINATOR (acceso a rutas de gestión)
  if (role === 'coordinator') {
    return children;
  }

  // Para REQUESTER (acceso a rutas de solicitudes)
  if (role === 'requester') {
    return children;
  }

  // Para VISITOR y EXTERNALVISITOR (acceso limitado a rutas básicas)
  if (role === 'visitor' || role === 'externalvisitor' || role === 'pending') {
    // Verificar si la ruta actual está permitida para visitantes
    const currentPath = window.location.pathname;

    // Rutas permitidas para visitantes
    const allowedPaths = ['/home', '/events', '/rooms', '/preview/'];

    const isAllowed = allowedPaths.some(
      path => currentPath === path || currentPath.startsWith(path)
    );

    if (isAllowed) {
      return children;
    }

    return <Navigate to="/home" replace />;
  }

  // Por defecto, permitir acceso
  return children;
};

export default ProtectedRoute;

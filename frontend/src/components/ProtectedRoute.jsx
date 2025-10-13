import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { role, isAuthenticated } = useSelector(state => state.auth);

  // Si el usuario no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si se requiere acceso de admin y el rol no es admin, redirigir a home
  if (adminOnly && role !== 'admin') {
    return <Navigate to="/home" replace />;
  }

  // Si pasa las verificaciones, renderiza los children
  return children;
};

export default ProtectedRoute;

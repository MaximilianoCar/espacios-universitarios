import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailsPage from './pages/EventDetailsPage';
import RoomsPage from './pages/RoomsPage';
import RoomDetailsPage from './pages/RoomDetailsPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';
import CreateReservationPage from './pages/CreateReservationPage';
import UserReservationsPage from './pages/UserReservationsPage';
import AdminReservationsPage from './pages/AdminReservationsPage';
import AdminRoomsPage from './pages/AdminRoomsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useDispatch } from 'react-redux';
import { refreshToken } from './features/auth/authActions';
import Layout from './components/Layout';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Intentar renovar el token al cargar la app
    dispatch(refreshToken());

    const interval = setInterval(() => {
      // Renovar el token cada 50 minutos (o el tiempo adecuado según tu configuración)
      dispatch(refreshToken());
    }, 50 * 60 * 1000);

    return () => clearInterval(interval); // Limpiar el intervalo al desmontar
  }, [dispatch]);

  return (
    <Layout>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />

        {/* Rutas públicas */}
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailsPage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/rooms/:id" element={<RoomDetailsPage />} />

        {/* Rutas protegidas solo para autenticados */}
        <Route
          path="/create-reservation"
          element={
            <ProtectedRoute>
              <CreateReservationPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-reservations"
          element={
            <ProtectedRoute>
              <UserReservationsPage />
            </ProtectedRoute>
          }
        />

        {/* Rutas protegidas solo para administradores */}
        <Route
          path="/reservations"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminReservationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute adminOnly={true}>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/rooms"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminRoomsPage />
            </ProtectedRoute>
          }
        />

        {/* Ruta para manejar cualquier ruta no válida */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;

import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
import ProtectedRouteCoord from './components/ProtectedRouteCoord';
import AdminPendingRequestsPage from './pages/AdminPendingRequestsPage';
import PreviewEventPage from './pages/PreviewEventPage';
import { refreshToken } from './features/auth/authActions';
import Layout from './components/Layout';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    // Intentar renovar el token al cargar la app
    dispatch(refreshToken());

    const interval = setInterval(() => {
      // Renovar el token cada 50 minutos
      dispatch(refreshToken());
    }, 50 * 60 * 1000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // Función para proteger todas las rutas excepto login y register
  const ProtectedElement = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Layout>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Todas las demás rutas son protegidas */}
        <Route
          path="/home"
          element={
            <ProtectedElement>
              <HomePage />
            </ProtectedElement>
          }
        />

        <Route
          path="/events"
          element={
            <ProtectedElement>
              <EventsPage />
            </ProtectedElement>
          }
        />

        <Route
          path="/events/:id"
          element={
            <ProtectedElement>
              <EventDetailsPage />
            </ProtectedElement>
          }
        />

        <Route
          path="/preview/:id"
          element={
            <ProtectedElement>
              <PreviewEventPage />
            </ProtectedElement>
          }
        />

        <Route
          path="/rooms"
          element={
            <ProtectedElement>
              <RoomsPage />
            </ProtectedElement>
          }
        />

        <Route
          path="/rooms/:id"
          element={
            <ProtectedElement>
              <RoomDetailsPage />
            </ProtectedElement>
          }
        />

        {/* Rutas con protección adicional de roles */}
        <Route
          path="/create-reservation"
          element={
            <ProtectedElement>
              <ProtectedRoute>
                <CreateReservationPage />
              </ProtectedRoute>
            </ProtectedElement>
          }
        />

        <Route
          path="/my-reservations"
          element={
            <ProtectedElement>
              <ProtectedRoute>
                <UserReservationsPage />
              </ProtectedRoute>
            </ProtectedElement>
          }
        />

        <Route
          path="/reservations"
          element={
            <ProtectedElement>
              <ProtectedRouteCoord adminOnly={true}>
                <AdminReservationsPage />
              </ProtectedRouteCoord>
            </ProtectedElement>
          }
        />

        <Route
          path="/pending"
          element={
            <ProtectedElement>
              <ProtectedRouteCoord adminOnly={true}>
                <AdminPendingRequestsPage />
              </ProtectedRouteCoord>
            </ProtectedElement>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedElement>
              <ProtectedRoute adminOnly={true}>
                <UsersPage />
              </ProtectedRoute>
            </ProtectedElement>
          }
        />

        <Route
          path="/admin/rooms"
          element={
            <ProtectedElement>
              <ProtectedRouteCoord adminOnly={true}>
                <AdminRoomsPage />
              </ProtectedRouteCoord>
            </ProtectedElement>
          }
        />

        {/* Ruta por defecto - redirige basado en autenticación */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/home" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Ruta para manejar cualquier ruta no válida */}
        <Route
          path="*"
          element={
            isAuthenticated ? (
              <Navigate to="/home" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Layout>
  );
}

export default App;

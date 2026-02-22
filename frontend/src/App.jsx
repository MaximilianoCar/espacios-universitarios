import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

// --- IMPORTS ESTÁTICOS (Críticos para el primer renderizado) ---
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import { refreshToken } from './features/auth/authActions';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedRouteCoord from './components/ProtectedRouteCoord';

// --- COMPONENTE DE LOADING MEJORADO ---
const PageLoader = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      width: '100%',
      gap: '1rem',
    }}
  >
    <div
      style={{
        width: '50px',
        height: '50px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
    />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
    <p
      style={{
        color: '#666',
        fontSize: '1.1rem',
        margin: 0,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      Cargando...
    </p>
  </div>
);

// --- IMPORTS LAZY (Páginas que se cargan bajo demanda) ---
const HomePage = lazy(() => import('./pages/HomePage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventDetailsPage = lazy(() => import('./pages/EventDetailsPage'));
const RoomsPage = lazy(() => import('./pages/RoomsPage'));
const RoomDetailsPage = lazy(() => import('./pages/RoomDetailsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const CreateReservationPage = lazy(
  () => import('./pages/CreateReservationPage')
);
const UserReservationsPage = lazy(() => import('./pages/UserReservationsPage'));
const AdminReservationsPage = lazy(
  () => import('./pages/AdminReservationsPage')
);
const AdminRoomsPage = lazy(() => import('./pages/AdminRoomsPage'));
const AdminPendingRequestsPage = lazy(
  () => import('./pages/AdminPendingRequestsPage')
);
const PreviewEventPage = lazy(() => import('./pages/PreviewEventPage'));

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    // Intentar renovar el token al cargar la app
    dispatch(refreshToken());

    const interval = setInterval(
      () => {
        // Renovar el token cada 50 minutos
        dispatch(refreshToken());
      },
      50 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [dispatch]);

  // Componente protector de rutas
  const ProtectedElement = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* --- RUTAS PÚBLICAS --- */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* --- RUTAS PROTEGIDAS BÁSICAS --- */}
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

          {/* --- RUTAS CON PROTECCIÓN ADICIONAL DE ROLES --- */}
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

          {/* --- RUTAS DE REDIRECCIÓN --- */}
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
      </Suspense>
    </Layout>
  );
}

export default App;

import axiosInstance, { setAuthToken, clearAuthToken } from '../../axiosConfig';
import { loginSuccess, refreshAccessToken, logout } from './authSlice';
import Swal from '../../utils/swal';

// Acción para iniciar sesión
export const login = (email, password, navigate) => async dispatch => {
  try {
    console.log('[auth] POST /login (via axiosInstance)');
    const response = await axiosInstance.post('/login', { email, password });

    // respuesta en distintos formatos: .data.data o .data
    const payload = response.data.data || response.data;
    const { token, refreshToken, name, role } = payload;

    // Guardar tokens en localStorage
    localStorage.setItem('user', name);
    localStorage.setItem('role', role);
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('isAuthenticated', true);

    // Establecer header en axios.defaults para evitar token antiguo en memoria
    setAuthToken(token);

    // Actualizar el estado global con Redux
    dispatch(loginSuccess({ name, role, token, refreshToken }));

    // Redirigir al usuario a la vista de Home
    navigate('/home');
  } catch (error) {
    // Distinción de errores para depuración
    console.error('[auth] Error al iniciar sesión:', error);
    if (!error.response) {
      // Network / CORS / proxy
      Swal.fire({
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor. Verifica que el backend esté disponible y que el proxy esté configurado. Prueba http://localhost:5173/api/ping',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    } else if (error.response.status === 404) {
      Swal.fire({
        title: 'Ruta no encontrada (404)',
        text: 'El servidor respondió 404 para /api/login. Revisa que la ruta exista en el backend y que el proxy esté apuntando al servidor correcto.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    } else {
      Swal.fire({
        title: 'Error',
        text:
          error.response?.data?.error ||
          'El correo o la contraseña son incorrectos',
        icon: 'error',
        confirmButtonText: 'Intentar de nuevo',
      });
    }
  }
};

// Acción para refrescar el token
export const refreshToken = () => async dispatch => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      dispatch(logout());
      localStorage.clear();
      clearAuthToken();
      return;
    }

    const response = await axiosInstance.post('/refresh-token', {
      refreshToken,
    });
    const { token: newToken } = response.data;

    // Guardar el nuevo token en localStorage
    localStorage.setItem('token', newToken);

    // Actualizar header en axios
    setAuthToken(newToken);

    // Actualizar el token en el estado global con Redux
    dispatch(refreshAccessToken({ token: newToken }));
  } catch (error) {
    console.error('Error al refrescar el token:', error);
    dispatch(logout());
    localStorage.clear();
    clearAuthToken();
  }
};

// Acción de cerrar sesión
export const logoutUser = () => dispatch => {
  // Eliminar los tokens de localStorage
  localStorage.removeItem('user');
  localStorage.removeItem('role');
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('isAuthenticated');

  // Limpiar header en axios
  clearAuthToken();

  // Despachar la acción de logout para limpiar el estado de Redux
  dispatch(logout());
};

export const logoutAndRedirect = navigate => async dispatch => {
  try {
    await axiosInstance.post('/logout');
    //  limpia tu estado global y el almacenamiento persistente.
    dispatch(logoutUser());

    navigate('/login');
  } catch (error) {
    console.error(
      'Error al cerrar sesión en el servidor. Limpiando sesión local',
      error
    );

    // Ejecutar la acción de limpieza del cliente (Redux y localStorage)
    dispatch(logoutUser());
    // Redirigir al usuario
    navigate('/login');

    Swal.fire({
      title: 'Advertencia',
      text: 'La sesión local fue cerrada, pero hubo un error al notificar al servidor.',
      icon: 'warning',
      confirmButtonText: 'Continuar',
    });
  }
};

import axiosInstance from '../../axiosConfig';
import { loginSuccess, refreshAccessToken, logout } from './authSlice';
import Swal from 'sweetalert2';

const API_URL = ''; //  la URL de tu API

// Acción para iniciar sesión
export const login = (email, password, navigate) => async dispatch => {
  try {
    const response = await axiosInstance.post(`${API_URL}/login`, {
      email,
      password,
    });
    const { token, refreshToken, name, role } = response.data.data;

    // Guardar tokens en localStorage

    localStorage.setItem('user', name);
    localStorage.setItem('role', role);
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('isAuthenticated', true);

    // Actualizar el estado global con Redux
    dispatch(loginSuccess({ name, role, token, refreshToken }));

    // Redirigir al usuario a la vista de Home
    navigate('/home');
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    // Mostrar SweetAlert de error
    Swal.fire({
      title: 'Error',
      text: 'El correo o la contraseña son incorrectos',
      icon: 'error',
      confirmButtonText: 'Intentar de nuevo',
    });
  }
};

// Acción para refrescar el token
export const refreshToken = () => async dispatch => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      dispatch(logout());
      localStorage.clear();
      return;
    }

    const response = await axiosInstance.post(`${API_URL}/refresh-token`, {
      refreshToken,
    });
    const { token: newToken } = response.data;

    // Guardar el nuevo token en localStorage
    localStorage.setItem('token', newToken);

    // Actualizar el token en el estado global con Redux
    dispatch(refreshAccessToken({ token: newToken }));
  } catch (error) {
    console.error('Error al refrescar el token:', error);
    dispatch(logout());
    localStorage.clear();
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

  // Despachar la acción de logout para limpiar el estado de Redux
  dispatch(logout());
};

export const logoutAndRedirect = navigate => async dispatch => {
  try {
    await axiosInstance.post(`${API_URL}/logout`);
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

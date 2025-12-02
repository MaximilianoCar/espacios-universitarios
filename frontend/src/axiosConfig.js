import axios from 'axios';

const base = import.meta.env.VITE_API_URL || '/api';

const axiosInstance = axios.create({
  baseURL: base,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Si ya hay token en localStorage al arrancar, colocarlo en defaults
const existingToken = localStorage.getItem('token');
if (existingToken) {
  axiosInstance.defaults.headers.common.Authorization = `Bearer ${existingToken}`;
}

// Helpers para controlar el header Authorization desde el app
export function setAuthToken(token) {
  if (token) {
    axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common.Authorization;
  }
}

export function clearAuthToken() {
  delete axiosInstance.defaults.headers.common.Authorization;
}

// Interceptor mejorado
axiosInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');

    console.log('Token en interceptor:', token ? 'Presente' : 'Ausente');

    if (token) {
      // Verificar que el token tenga formato válido
      if (token.startsWith('Bearer ')) {
        config.headers.Authorization = token;
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else {
      console.warn('No hay token disponible');
    }

    return config;
  },
  error => {
    console.error('Error en interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Agregar interceptor de respuesta para debugging
axiosInstance.interceptors.response.use(
  response => {
    console.log('Respuesta exitosa:', response.config.url);
    return response;
  },
  error => {
    console.error('Error en respuesta:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

export default axiosInstance;

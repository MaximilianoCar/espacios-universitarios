import axios from 'axios';

// Usar la variable VITE_API_URL (si está definida por Vite) y caer a '/api' en desarrollo (para que el proxy de Vite funcione). Esto evita que el frontend llame directamente al túnel y permite usar el proxy local.
const base = import.meta.env.VITE_API_URL || '/api';

// Crear una instancia de Axios
const axiosInstance = axios.create({
  baseURL: base,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Importante para CORS con credenciales
});

// Interceptor para añadir el token de autorización a cada solicitud
axiosInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token'); // Acceder al token desde el estado de Redux

    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Agregar el token a los encabezados
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export default axiosInstance;

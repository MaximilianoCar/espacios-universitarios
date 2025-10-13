import axios from 'axios';

// Crear una instancia de Axios
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api', // Establecer la URL base
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

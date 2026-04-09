import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axiosInstance from '../axiosConfig';

export const usePendingUsers = ({ enabled = true } = {}) => {
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { role } = useSelector(state => state.auth);

  useEffect(() => {
    const fetchPendingUsersCount = async () => {
      // Verificar si debe ejecutarse según el prop enabled y el rol
      if (!enabled || role !== 'admin') {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        //console.log('Solicitando conteo de usuarios pendientes...');
        const response = await axiosInstance.get('/users/pending-count');

        //console.log('Conteo de usuarios pendientes recibido:', response.data);
        setPendingUsersCount(response.data.count || 0);
      } catch (error) {
        console.error('Error en usePendingUsers:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });

        // errores
        if (error.response?.status === 404) {
          setError('Endpoint no encontrado. Verifica las rutas del backend.');
        } else if (error.response?.status === 500) {
          setError('Error del servidor. Verifica los logs del backend.');
        } else {
          setError('Error al cargar el conteo de usuarios pendientes');
        }

        setPendingUsersCount(0);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchPendingUsersCount, 500);
    return () => clearTimeout(timer);
  }, [role, enabled]); // Añadir enabled a las dependencias

  return { pendingUsersCount, loading, error };
};

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axiosInstance from '../axiosConfig';

export const useUserEventsCount = ({ enabled = true } = {}) => {
  const [eventsCount, setEventsCount] = useState({
    approved: 0,
    denied: 0,
    pending: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { role } = useSelector(state => state.auth);

  useEffect(() => {
    const fetchUserEventsCount = async () => {
      // Verificar si debe ejecutarse según el prop enabled y el rol
      if (!enabled || role !== 'requester') {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('Solicitando conteo de eventos del usuario...');
        const response = await axiosInstance.get('/events/user/count');

        console.log('Conteo de eventos del usuario recibido:', response.data);
        setEventsCount(response.data);
      } catch (error) {
        console.error('Error en useUserEventsCount:', {
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
          setError('Error al cargar el conteo de eventos');
        }

        // Resetear a cero en caso de error
        setEventsCount({ approved: 0, denied: 0, pending: 0, total: 0 });
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchUserEventsCount, 500);
    return () => clearTimeout(timer);
  }, [role, enabled]); // Añadir enabled a las dependencias

  return { eventsCount, loading, error };
};

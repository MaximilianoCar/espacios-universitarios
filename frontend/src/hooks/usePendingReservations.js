import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axiosInstance from '../axiosConfig';

export const usePendingReservations = ({ enabled = true } = {}) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { role } = useSelector(state => state.auth);

  useEffect(() => {
    const fetchPendingCount = async () => {
      // Verificar si debe ejecutarse según el prop enabled y el rol
      if (!enabled || !['admin', 'coordinator'].includes(role)) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axiosInstance.get('/events/pending-count');
        setPendingCount(response.data.count || 0);
      } catch (error) {
        console.error('Error fetching pending count:', error);
        setError(error.response?.data?.error || error.message);
        setPendingCount(0);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchPendingCount, 300);
    return () => clearTimeout(timer);
  }, [role, enabled]); // Añadir enabled a las dependencias

  return { pendingCount, loading, error };
};

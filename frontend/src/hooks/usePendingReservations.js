import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axiosInstance from '../axiosConfig';

export const usePendingReservations = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { role } = useSelector(state => state.auth);

  useEffect(() => {
    const fetchPendingCount = async () => {
      if (!['admin', 'coordinator'].includes(role)) {
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
  }, [role]);

  return { pendingCount, loading, error };
};

import { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchRooms,
  selectRooms,
  selectRoomsLastFetched,
} from '../features/rooms/roomsSlice';

const UpdateEventForm = ({ event, onEventUpdated }) => {
  const [formData, setFormData] = useState({
    name: event.name || '',
    description: event.description || '',
    capacity: event.capacity || '',
    cost: event.cost || '',
    contact: event.contact || '',
    eventFrom: event.eventFrom || '',
    eventTo: event.eventTo || '',
    roomId: event.roomId || '',
    status: event.status || 'pending',
  });

  const [schedules, setSchedules] = useState(
    Array.isArray(event.schedules) ? event.schedules : []
  );
  const [isPeriodic, setIsPeriodic] = useState(
    Array.isArray(event.schedules) && event.schedules.length > 0
  );
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const rooms = useSelector(selectRooms);
  const lastFetched = useSelector(selectRoomsLastFetched);

  useEffect(() => {
    if (!lastFetched) {
      dispatch(fetchRooms());
    }
  }, [dispatch, lastFetched]);

  const addSchedule = () => {
    setSchedules(prev => [
      ...prev,
      { eventFrom: '', eventTo: '', reservationFrom: '', reservationTo: '' },
    ]);
    setIsPeriodic(true);
  };

  const updateSchedule = (idx, field, value) => {
    setSchedules(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const removeSchedule = idx => {
    setSchedules(prev => prev.filter((_, i) => i !== idx));
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    if (isPeriodic && schedules && schedules.length > 0) {
      data.append('schedules', JSON.stringify(schedules));
    }

    axiosInstance
      .put(`/events/${event.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(response => {
        onEventUpdated(response.data);
      })
      .catch(err => {
        console.error('Error updating event:', err);
        setError(
          'Error al actualizar el evento. Por favor, intente nuevamente.'
        );
      });
  };

  return (
    <div className="max-w-2xl mx-auto my-4 bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Actualizar Evento</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block">Nombre del Evento</label>
          <input
            type="text"
            name="name"
            className="w-full border p-2"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        {/* Description */}
        <div>
          <label className="block">Descripción</label>
          <textarea
            name="description"
            className="w-full border p-2"
            value={formData.description}
            onChange={handleChange}
          ></textarea>
        </div>
        {/* Capacity */}
        <div>
          <label className="block">Capacidad</label>
          <input
            type="number"
            name="capacity"
            className="w-full border p-2"
            value={formData.capacity}
            onChange={handleChange}
            required
          />
        </div>
        {/* Cost */}
        <div>
          <label className="block">Costo</label>
          <input
            type="text"
            name="cost"
            className="w-full border p-2"
            value={formData.cost}
            onChange={handleChange}
            required
          />
        </div>
        {/* Contact */}
        <div>
          <label className="block">Contacto</label>
          <input
            type="text"
            name="contact"
            className="w-full border p-2"
            value={formData.contact}
            onChange={handleChange}
            required
          />
        </div>
        {/* Event From */}
        <div>
          <label className="block">Inicio del Evento</label>
          <input
            type="datetime-local"
            name="eventFrom"
            className="w-full border p-2"
            value={formData.eventFrom}
            onChange={handleChange}
            required
          />
        </div>
        {/* Event To */}
        <div>
          <label className="block">Fin del Evento</label>
          <input
            type="datetime-local"
            name="eventTo"
            className="w-full border p-2"
            value={formData.eventTo}
            onChange={handleChange}
            required
          />
        </div>
        {/* Periodicidad / Schedules (editable) */}
        <div>
          <label className="block">Evento con múltiples horarios</label>
          <div className="flex items-center gap-3 mb-3">
            <input
              type="checkbox"
              checked={isPeriodic}
              onChange={() => setIsPeriodic(prev => !prev)}
            />
            <span className="text-sm text-gray-700">
              Habilitar múltiples horarios
            </span>
          </div>

          {isPeriodic && (
            <div className="space-y-2">
              {schedules.map((s, idx) => (
                <div key={idx} className="p-2 border rounded">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="datetime-local"
                      value={s.eventFrom || ''}
                      onChange={e =>
                        updateSchedule(idx, 'eventFrom', e.target.value)
                      }
                      className="w-full border p-1"
                    />
                    <input
                      type="datetime-local"
                      value={s.eventTo || ''}
                      onChange={e =>
                        updateSchedule(idx, 'eventTo', e.target.value)
                      }
                      className="w-full border p-1"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    <input
                      type="datetime-local"
                      value={s.reservationFrom || ''}
                      onChange={e =>
                        updateSchedule(idx, 'reservationFrom', e.target.value)
                      }
                      className="w-full border p-1"
                    />
                    <input
                      type="datetime-local"
                      value={s.reservationTo || ''}
                      onChange={e =>
                        updateSchedule(idx, 'reservationTo', e.target.value)
                      }
                      className="w-full border p-1"
                    />
                  </div>
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => removeSchedule(idx)}
                      className="text-red-600 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
              <div>
                <button
                  type="button"
                  onClick={addSchedule}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  Agregar horario
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Room ID */}
        <div>
          <label className="block">Sala</label>
          <select
            name="roomId"
            className="w-full border p-2"
            value={formData.roomId}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona una sala</option>
            {rooms.map(room => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </div>
        {/* Status */}
        <div>
          <label className="block">Estado</label>
          <select
            name="status"
            className="w-full border p-2"
            value={formData.status}
            onChange={handleChange}
            required
          >
            <option value="pending">Pendiente</option>
            <option value="approved">Aprobado</option>
            <option value="denied">Denegado</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Guardar Cambios
        </button>
      </form>
    </div>
  );
};

export default UpdateEventForm;

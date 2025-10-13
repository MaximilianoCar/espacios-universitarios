import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig';

const UpdateEventForm = ({ event, onEventUpdated }) => {
  const [formData, setFormData] = useState({
    name: event.name,
    description: event.description,
    capacity: event.capacity,
    cost: event.cost,
    contact: event.contact,
    eventFrom: event.eventFrom,
    eventTo: event.eventTo,
    roomId: event.roomId,
    status: event.status,
  });
  const [error, setError] = useState('');
  const [rooms, setRooms] = useState([]);

  // Fetch rooms to populate the dropdown
  useEffect(() => {
    axiosInstance
      .get('/rooms')
      .then(response => {
        setRooms(response.data);
      })
      .catch(error => {
        console.error('Error fetching rooms:', error);
      });
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = e => {
    e.preventDefault();

    const data = new FormData();
    // Agregar los campos del formulario al FormData
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });

    axiosInstance
      .put(`/events/${event.id}`, formData)
      .then(response => {
        // Handle success
        console.log('Event updated:', response.data);
        onEventUpdated(response.data);
      })
      .catch(error => {
        // Handle error
        console.error('Error updating event:', error);
        setError(
          'Error al actualizar el evento. Por favor, intente nuevamente.'
        );
      });
  };

  return (
    <div className="my-4">
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

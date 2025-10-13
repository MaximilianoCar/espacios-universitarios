// src/components/UpdateRoomForm.jsx
import React, { useState } from 'react';
import axiosInstance from '../axiosConfig';

const UpdateRoomForm = ({ room, onRoomSaved }) => {
  const [formData, setFormData] = useState({ ...room });
  const [error, setError] = useState('');

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = e => {
    e.preventDefault();

    axiosInstance
      .put(`/rooms/${room.id}`, formData)
      .then(response => {
        onRoomSaved(response.data);
      })
      .catch(error => {
        console.error('Error updating room:', error);
        setError('Error al actualizar la sala. Por favor, intente nuevamente.');
      });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Actualizar Sala</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit}>
        {/* Campos del formulario */}
        <div className="mb-4">
          <label className="block font-semibold">Nombre</label>
          <input
            type="text"
            name="name"
            className="w-full border p-2 rounded"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        {/* Agrega los demás campos de manera similar */}
        <div className="mb-4">
          <label className="block font-semibold">Descripción</label>
          <textarea
            name="description"
            className="w-full border p-2 rounded"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>
        {/* Capacidad */}
        <div className="mb-4">
          <label className="block font-semibold">Capacidad</label>
          <input
            type="number"
            name="capacity"
            className="w-full border p-2 rounded"
            value={formData.capacity}
            onChange={handleChange}
            required
          />
        </div>
        {/* Ubicación */}
        <div className="mb-4">
          <label className="block font-semibold">Ubicación</label>
          <input
            type="text"
            name="location"
            className="w-full border p-2 rounded"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </div>
        {/* Encargado */}
        <div className="mb-4">
          <label className="block font-semibold">Encargado</label>
          <input
            type="text"
            name="staffowner"
            className="w-full border p-2 rounded"
            value={formData.staffowner}
            onChange={handleChange}
            required
          />
        </div>
        {/* Botón de envío */}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Actualizar Sala
        </button>
      </form>
    </div>
  );
};

export default UpdateRoomForm;

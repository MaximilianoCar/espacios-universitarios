// src/components/UpdateUserForm.js
import React, { useState } from 'react';
import axiosInstance from '../axiosConfig';

const UpdateUserForm = ({ user, onUserUpdated }) => {
  const [formData, setFormData] = useState({
    role: user.role,
    name: user.name,
    email: user.email,
    ci: user.ci || '',
    status: user.status,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await axiosInstance.put(`/users/${user.id}`, formData);
      console.log('User updated:', response.data);
      setSuccess('Usuario actualizado exitosamente.');
      onUserUpdated({ ...user, ...formData });
    } catch (error) {
      console.error('Error updating user:', error);
      setError(
        error.response?.data?.error ||
          'Error al actualizar el usuario. Por favor, intente nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl">
      <h3 className="text-xl font-bold mb-4">Actualizar Usuario</h3>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role */}
        <div>
          <label className="block text-gray-700 mb-2">Rol</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="visitor">Visitante</option>
            <option value="requester">Solicitante</option>
            <option value="coordinator">Coordinador</option>
            <option value="admin">Admin</option>
            <option value="pending">Pendiente</option>
          </select>
        </div>

        {/* Name */}
        <div>
          <label className="block text-gray-700 mb-2">Nombre</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ingrese el nombre completo"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-gray-700 mb-2">Correo Electrónico</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ingrese el correo electrónico"
          />
        </div>

        {/* CI */}
        <div>
          <label className="block text-gray-700 mb-2">
            CI (Cédula de Identidad)
          </label>
          <input
            type="text"
            name="ci"
            value={formData.ci}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ingrese la cédula de identidad"
          />
        </div>

        {/* Status */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="status"
            id="status"
            checked={formData.status}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="status" className="ml-2 block text-gray-700">
            Usuario Activo
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => onUserUpdated(user)} // Cancelar y volver a la lista
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition duration-150"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition duration-150"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateUserForm;

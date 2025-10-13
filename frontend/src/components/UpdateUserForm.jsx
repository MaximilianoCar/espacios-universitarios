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

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = e => {
    e.preventDefault();

    // Send a PUT request to update the user
    axiosInstance
      .put(`/users/${user.id}`, formData)
      .then(response => {
        // Handle success
        console.log('User updated:', response.data);
        setSuccess('Usuario actualizado exitosamente.');
        setError('');
        onUserUpdated({ ...user, ...formData });
      })
      .catch(error => {
        // Handle error
        console.error('Error updating user:', error);
        setError(
          error.response?.data?.error ||
            'Error al actualizar el usuario. Por favor, intente nuevamente.'
        );
        setSuccess('');
      });
  };

  return (
    <div className="my-4">
      <h2 className="text-2xl font-bold mb-4">Actualizar Usuario</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role */}
        <div>
          <label className="block">Rol</label>
          <select
            name="role"
            className="w-full border p-2"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        {/* Name */}
        <div>
          <label className="block">Nombre</label>
          <input
            type="text"
            name="name"
            className="w-full border p-2"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        {/* Email */}
        <div>
          <label className="block">Correo Electrónico</label>
          <input
            type="email"
            name="email"
            className="w-full border p-2"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        {/* CI */}
        <div>
          <label className="block">CI</label>
          <input
            type="text"
            name="ci"
            className="w-full border p-2"
            value={formData.ci}
            onChange={handleChange}
          />
        </div>
        {/* Status */}
        <div>
          <label className="block">Estado</label>
          <input
            type="checkbox"
            name="status"
            checked={formData.status}
            onChange={handleChange}
          />
          <span className="ml-2">
            {formData.status ? 'Activo' : 'Inactivo'}
          </span>
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

export default UpdateUserForm;

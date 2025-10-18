// src/components/CreateUserForm.js
import React, { useState } from 'react';
import axiosInstance from '../axiosConfig';

const CreateUserForm = ({ onUserCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    ci: '',
    role: 'visitor', // Valor por defecto
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await axiosInstance.post('/anyusers', formData);
      alert('Usuario creado con éxito.');
      onUserCreated();
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error.response?.data?.error || 'Error al crear el usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl">
      <h3 className="text-xl font-bold mb-4">Crear Nuevo Usuario</h3>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div>
          <label className="block text-gray-700 mb-2">Contraseña</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="6"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ingrese la contraseña"
          />
        </div>

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

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
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
            {isSubmitting ? 'Creando...' : 'Crear Usuario'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateUserForm;

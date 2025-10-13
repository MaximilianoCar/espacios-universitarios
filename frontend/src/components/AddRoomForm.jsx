// src/components/AddRoomForm.jsx
import React, { useState } from 'react';
import axiosInstance from '../axiosConfig';

const AddRoomForm = ({ onRoomCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: '',
    location: '',
    staffowner: '',
  });
  const [imageFile, setImageFile] = useState(null); // Nuevo estado para la imagen
  const [error, setError] = useState('');

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = e => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = e => {
    e.preventDefault();

    const data = new FormData();
    // Agregar los campos del formulario al FormData
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    // Agregar el archivo de imagen
    if (imageFile) {
      data.append('image', imageFile);
    }

    axiosInstance
      .post('/rooms', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then(response => {
        console.log('Espacio creado:', response.data);
        onRoomCreated(response.data);
      })
      .catch(error => {
        console.error('Error al crear el espacio:', error);

        const errorMessage =
          error.response?.data?.error ||
          error.response?.data?.errors?.join(', ') ||
          'Error al crear el espacio. Por favor, intente nuevamente.';

        setError(errorMessage);
      });
  };

  return (
    <div className="my-8">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Crear Nuevo Espacio
      </h2>
      {error && (
        <p className="text-red-500 mb-4 text-center bg-red-100 p-2 rounded">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información de la Sala */}
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
          {/* Nombre de la Sala */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Nombre del Espacio
            </label>
            <input
              type="text"
              name="name"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          {/* Descripción */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Descripción
            </label>
            <textarea
              name="description"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.description}
              onChange={handleChange}
              rows="4"
            ></textarea>
          </div>
          {/* Capacidad y Ubicación */}
          <div className="flex flex-wrap -mx-2">
            {/* Capacidad */}
            <div className="w-full md:w-1/2 px-2 mb-4 md:mb-0">
              <label className="block text-gray-700 font-medium mb-2">
                Capacidad
              </label>
              <input
                type="number"
                name="capacity"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.capacity}
                onChange={handleChange}
                required
              />
            </div>
            {/* Ubicación */}
            <div className="w-full md:w-1/2 px-2">
              <label className="block text-gray-700 font-medium mb-2">
                Ubicación
              </label>
              <input
                type="text"
                name="location"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          {/* Encargado */}
          <div className="mt-4">
            <label className="block text-gray-700 font-medium mb-2">
              Encargado
            </label>
            <input
              type="text"
              name="staffowner"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.staffowner}
              onChange={handleChange}
              required
            />
          </div>
          {/* Campo para subir imagen */}
          <div className="mt-4">
            <label className="block text-gray-700 font-medium mb-2">
              Imagen del Espacio
            </label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full"
            />
          </div>
        </div>

        {/* Botón de Envío */}
        <div className="text-center">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded shadow-md transition duration-200"
          >
            Crear Espacio
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRoomForm;

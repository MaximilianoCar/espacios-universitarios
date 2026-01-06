// src/components/AddRoomForm.jsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig';
import Swal from 'sweetalert2';
import { FaUsers } from 'react-icons/fa';

const AddRoomForm = ({ onRoomCreated, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: '',
    location: '',
    staffowner: '',
    isInCUC: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dependencies, setDependencies] = useState([]);
  const [selectedDependencyId, setSelectedDependencyId] = useState('');
  const [showAddDependency, setShowAddDependency] = useState(false);
  const [newDependency, setNewDependency] = useState({
    name: '',
    description: '',
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = e => {
    setImageFile(e.target.files[0]);
  };

  useEffect(() => {
    axiosInstance
      .get('/dependencies')
      .then(res => setDependencies(res.data || []))
      .catch(err => console.error('Error fetching dependencies', err));
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();

    // Validación básica
    if (
      !formData.name ||
      !formData.capacity ||
      !formData.location ||
      !formData.staffowner
    ) {
      setError('Por favor complete todos los campos obligatorios.');
      return;
    }

    // validar dependencia
    if (!selectedDependencyId) {
      setError(
        'Por favor seleccione la dependencia a la que pertenece el espacio.'
      );
      return;
    }

    setIsSubmitting(true);
    setError('');

    // Mostrar modal de confirmación
    const confirmResult = await Swal.fire({
      title: '¿Crear nuevo espacio?',
      text: `¿Está seguro de que desea crear el espacio "${formData.name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, crear',
      cancelButtonText: 'Cancelar',
    });

    if (!confirmResult.isConfirmed) {
      setIsSubmitting(false);
      return;
    }

    // Mostrar modal de carga
    Swal.fire({
      title: 'Creando espacio...',
      text: `Por favor espere mientras se crea "${formData.name}"`,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const data = new FormData();
      // Agregar los campos del formulario al FormData
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      // agregar dependencyId
      data.append('dependencyId', selectedDependencyId);
      // Agregar el archivo de imagen
      if (imageFile) {
        data.append('image', imageFile);
      }

      const response = await axiosInstance.post('/rooms', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Cerrar modal de carga
      Swal.close();

      // Mostrar modal de éxito
      await Swal.fire({
        title: '¡Creado!',
        text: `El espacio "${formData.name}" ha sido creado exitosamente.`,
        icon: 'success',
        confirmButtonColor: '#3085d6',
      });

      // Llamar a la función del padre para actualizar la lista
      onRoomCreated(response.data);
    } catch (error) {
      console.error('Error al crear el espacio:', error);

      // Cerrar modal de carga
      Swal.close();

      let errorMessage =
        error.response?.data?.error ||
        (error.response?.data?.errors
          ? error.response.data.errors.join(', ')
          : undefined) ||
        'Error al crear el espacio. Por favor, intente nuevamente.';

      if (error.response?.status === 403) {
        // permiso negado (coordinador intentando crear en dependencia sin permiso)
        errorMessage =
          error.response.data.error ||
          'No tienes permisos para crear salas en esta dependencia.';
      }

      // Mostrar modal de error
      await Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#d33',
      });

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateDependency = async () => {
    if (!newDependency.name.trim()) {
      Swal.fire({
        title: 'Error',
        text: 'El nombre es requerido',
        icon: 'error',
      });
      return;
    }

    try {
      const res = await axiosInstance.post('/dependencies', newDependency);
      // refresh deps
      const depsRes = await axiosInstance.get('/dependencies');
      setDependencies(depsRes.data || []);
      setSelectedDependencyId(res.data.id);
      setShowAddDependency(false);
      setNewDependency({ name: '', description: '' });
      Swal.fire({
        title: '¡Creada!',
        text: 'Dependencia creada.',
        icon: 'success',
      });
    } catch (err) {
      console.error('Error creating dependency', err);
      Swal.fire({
        title: 'Error',
        text: err.response?.data?.error || 'No se pudo crear la dependencia',
        icon: 'error',
      });
    }
  };

  const handleCancel = () => {
    if (isSubmitting) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: 'El proceso de creación se cancelará y se perderán los datos ingresados.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'Continuar',
      }).then(result => {
        if (result.isConfirmed) {
          onClose();
        }
      });
    } else {
      onClose();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Crear Nuevo Espacio
        </h2>
        <button
          onClick={handleCancel}
          disabled={isSubmitting}
          className="text-gray-500 hover:text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cerrar
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Información de la Sala */}
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
          {/* Nombre de la Sala */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Nombre del Espacio *
            </label>
            <input
              type="text"
              name="name"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              placeholder="Ingrese el nombre del espacio"
            />
          </div>

          {/* Descripción */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Descripción *
            </label>
            <textarea
              name="description"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              required
              disabled={isSubmitting}
              placeholder="Describa el espacio"
            ></textarea>
          </div>

          {/* Capacidad y Ubicación */}
          <div className="flex flex-wrap -mx-2">
            {/* Capacidad */}
            <div className="w-full md:w-1/2 px-2 mb-4 md:mb-0">
              <label className="block text-gray-700 font-medium mb-2">
                Capacidad *
              </label>
              <input
                type="number"
                name="capacity"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                value={formData.capacity}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                min="1"
                placeholder="Ej: 50"
              />
            </div>

            {/* Ubicación */}
            <div className="w-full md:w-1/2 px-2">
              <label className="block text-gray-700 font-medium mb-2">
                Ubicación *
              </label>
              <input
                type="text"
                name="location"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                value={formData.location}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                placeholder="Ej: Edificio A, Piso 2"
              />
            </div>
          </div>

          {/* Dependencia */}
          <div className="mt-4">
            <label className="block text-gray-700 font-medium mb-2">
              Dependencia *
            </label>
            {!showAddDependency ? (
              <div className="flex items-center space-x-2">
                <select
                  name="dependency"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedDependencyId}
                  onChange={e => setSelectedDependencyId(e.target.value)}
                  required
                  disabled={isSubmitting}
                >
                  <option value="">-- Selecciona una dependencia --</option>
                  {dependencies.map(dep => (
                    <option key={dep.id} value={dep.id}>
                      {dep.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddDependency(true)}
                  className="px-3 py-2 bg-green-500 text-white rounded"
                >
                  + Agregar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Nombre de la dependencia"
                  value={newDependency.name}
                  onChange={e =>
                    setNewDependency({ ...newDependency, name: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
                <textarea
                  placeholder="Descripción (opcional)"
                  value={newDependency.description}
                  onChange={e =>
                    setNewDependency({
                      ...newDependency,
                      description: e.target.value,
                    })
                  }
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleCreateDependency}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    Crear
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddDependency(false)}
                    className="px-4 py-2 border rounded"
                  >
                    Atrás
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ¿Ubicado en CUC? */}
          <div className="mt-4">
            <label className="block text-gray-700 font-medium mb-2">
              ¿Ubicado en la Ciudad Universitaria de Caracas? *
            </label>
            <select
              name="isInCUC"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              value={formData.isInCUC}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            >
              <option value={true}>Sí</option>
              <option value={false}>No</option>
            </select>
          </div>

          {/* Encargado */}
          <div className="mt-4">
            <label className="block text-gray-700 font-medium mb-2">
              Encargado *
            </label>
            <input
              type="text"
              name="staffowner"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              value={formData.staffowner}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              placeholder="Nombre del encargado"
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
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            />
            <p className="text-sm text-gray-500 mt-1">
              Formatos aceptados: JPG, PNG, GIF. Tamaño máximo: 5MB
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creando...
              </>
            ) : (
              'Crear Espacio'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRoomForm;

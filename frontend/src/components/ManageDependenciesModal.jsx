// components/ManageDependenciesModal.jsx
import React, { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import Swal from 'sweetalert2';
import {
  FaBuilding,
  FaEdit,
  FaTrash,
  FaPlus,
  FaTimes,
  FaSave,
  FaSpinner,
  FaInfoCircle,
} from 'react-icons/fa';

const ManageDependenciesModal = ({ isOpen, onClose }) => {
  const [dependencies, setDependencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [selectedDependency, setSelectedDependency] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchDependencies();
      resetForm();
    }
  }, [isOpen]);

  const fetchDependencies = async () => {
    setLoading(true);
    try {
      const resp = await axiosInstance.get('/dependencies');
      setDependencies(resp.data || []);
    } catch (err) {
      console.error('Error fetching dependencies', err);
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar las dependencias.',
        icon: 'error',
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', description: '' });
    setEditingId(null);
    setErrors({});
    setSelectedDependency(null);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'El nombre de la dependencia es requerido';
    } else if (form.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    } else if (form.name.trim().length > 100) {
      newErrors.name = 'El nombre no puede exceder 100 caracteres';
    }

    if (form.description && form.description.length > 500) {
      newErrors.description = 'La descripción no puede exceder 500 caracteres';
    }

    // Validar duplicados (case-insensitive, ignorando espacios)
    const normalizedNewName = form.name.trim().toLowerCase();
    const duplicate = dependencies.find(dep => {
      if (editingId && dep.id === editingId) return false;
      return dep.name.toLowerCase() === normalizedNewName;
    });

    if (duplicate) {
      newErrors.name = 'Ya existe una dependencia con ese nombre';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) {
      Swal.fire({
        title: 'Error de validación',
        text: 'Por favor corrige los errores en el formulario',
        icon: 'error',
      });
      return;
    }

    setSubmitting(true);

    try {
      if (editingId) {
        // Actualizar
        await axiosInstance.put(`/dependencies/${editingId}`, form);
        Swal.fire({
          title: '¡Actualizado!',
          text: 'Dependencia actualizada correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        // Crear
        await axiosInstance.post('/dependencies', form);
        Swal.fire({
          title: '¡Creada!',
          text: 'Dependencia creada correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      }

      await fetchDependencies();
      resetForm();
    } catch (err) {
      console.error('Error saving dependency', err);

      let errorMessage = 'Error al guardar la dependencia';
      if (err.response?.status === 409) {
        errorMessage = 'Ya existe una dependencia con ese nombre';
        setErrors({ name: errorMessage });
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }

      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = dep => {
    setEditingId(dep.id);
    setForm({
      name: dep.name,
      description: dep.description || '',
    });
    setSelectedDependency(dep);
    setErrors({});

    // Scroll suave al formulario en móvil
    if (window.innerWidth < 768) {
      document.querySelector('.dependency-form-section')?.scrollIntoView({
        behavior: 'smooth',
      });
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: '¿Eliminar dependencia?',
      html: `
        <p>Esta acción eliminará permanentemente la dependencia:</p>
        <p class="font-bold text-lg text-red-600 mt-2">"${name}"</p>
        <p class="text-sm text-gray-600 mt-2">
          <i class="text-yellow-600">Nota:</i> Esta acción no se puede deshacer.
        </p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await axiosInstance.delete(`/dependencies/${id}`);

      // Si estamos editando la dependencia que se elimina, limpiar formulario
      if (editingId === id) {
        resetForm();
      }

      setDependencies(prev => prev.filter(d => d.id !== id));

      Swal.fire({
        title: '¡Eliminada!',
        text: 'Dependencia eliminada correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error('Error deleting dependency', err);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo eliminar la dependencia',
        icon: 'error',
      });
    }
  };

  const handleClose = () => {
    const hasChanges = form.name || form.description || editingId;

    if (hasChanges) {
      Swal.fire({
        title: '¿Descartar cambios?',
        text: 'Tienes cambios sin guardar en el formulario',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, descartar',
        cancelButtonText: 'Cancelar',
      }).then(result => {
        if (result.isConfirmed) {
          onClose();
        }
      });
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Gestionar Dependencias</h2>
              <p className="text-blue-100 text-sm mt-1">
                Crea y gestiona las dependencias para organizar los espacios
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-blue-200 text-3xl transition-colors"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Columna izquierda - Lista */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  Lista de Dependencias
                </h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {dependencies.length} dependencia
                  {dependencies.length !== 1 ? 's' : ''}
                </span>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="text-center">
                    <FaSpinner className="animate-spin text-3xl text-blue-500 mx-auto mb-3" />
                    <p className="text-gray-600">Cargando dependencias...</p>
                  </div>
                </div>
              ) : dependencies.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <FaBuilding className="text-4xl text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">
                    No hay dependencias
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Comienza creando tu primera dependencia
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {dependencies.map(dep => (
                    <div
                      key={dep.id}
                      className={`p-4 rounded-lg border transition-all ${
                        selectedDependency?.id === dep.id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedDependency(dep)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <FaBuilding
                              className={`mr-2 ${
                                selectedDependency?.id === dep.id
                                  ? 'text-blue-600'
                                  : 'text-gray-500'
                              }`}
                            />
                            <h4 className="font-semibold text-gray-800">
                              {dep.name}
                            </h4>
                            {editingId === dep.id && (
                              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                Editando
                              </span>
                            )}
                          </div>

                          {dep.description ? (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {dep.description}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic mt-1">
                              Sin descripción
                            </p>
                          )}
                        </div>

                        <div className="flex space-x-2 ml-3">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleEdit(dep);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Editar dependencia"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDelete(dep.id, dep.name);
                            }}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                            title="Eliminar dependencia"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Columna derecha - Formulario */}
            <div className="dependency-form-section">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {editingId
                      ? 'Editar Dependencia'
                      : 'Crear Nueva Dependencia'}
                  </h3>
                  {editingId && (
                    <button
                      onClick={resetForm}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                    >
                      <FaPlus className="mr-1" size={12} />
                      Nueva
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaBuilding className="inline mr-2 text-blue-500" />
                      Nombre de la Dependencia{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e =>
                        setForm(prev => ({ ...prev, name: e.target.value }))
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                        errors.name
                          ? 'border-red-500 ring-1 ring-red-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="Ej: Facultad de Ciencias"
                      maxLength={100}
                    />
                    {errors.name ? (
                      <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                        {errors.name}
                      </p>
                    ) : (
                      <div className="flex justify-between mt-1">
                        <p className="text-xs text-gray-500">
                          Nombre único para identificar la dependencia
                        </p>
                        <p className="text-xs text-gray-500">
                          {form.name.length}/100
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaInfoCircle className="inline mr-2 text-blue-500" />
                      Descripción (Opcional)
                    </label>
                    <textarea
                      value={form.description}
                      onChange={e =>
                        setForm(prev => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={4}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                        errors.description
                          ? 'border-red-500 ring-1 ring-red-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="Breve descripción de la dependencia..."
                      maxLength={500}
                    />
                    {errors.description ? (
                      <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                        {errors.description}
                      </p>
                    ) : (
                      <div className="flex justify-between mt-1">
                        <p className="text-xs text-gray-500">
                          Describe el propósito o características de la
                          dependencia
                        </p>
                        <p className="text-xs text-gray-500">
                          {form.description?.length || 0}/500
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Botones del formulario */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      disabled={submitting}
                    >
                      Limpiar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <FaSpinner className="animate-spin mr-2" />
                          {editingId ? 'Actualizando...' : 'Creando...'}
                        </>
                      ) : (
                        <>
                          <FaSave className="mr-2" />
                          {editingId ? 'Actualizar' : 'Crear'}
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Información sobre uso */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    ¿Cómo funcionan las dependencias?
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span>
                        Cada espacio debe pertenecer a una dependencia
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span>
                        Los coordinadores se asignan a dependencias, no a
                        espacios individuales
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span>
                        Las dependencias organizan los espacios por áreas o
                        departamentos
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {editingId
                ? `Editando: ${selectedDependency?.name || 'Dependencia'}`
                : ''}
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageDependenciesModal;

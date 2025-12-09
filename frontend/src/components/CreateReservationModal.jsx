import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig';
import Swal from 'sweetalert2';
import {
  FaCalendarAlt,
  FaUsers,
  FaDollarSign,
  FaMapPin,
  FaFileAlt,
  FaUser,
  FaPhone,
  FaFileImage,
} from 'react-icons/fa';

const CreateReservationModal = ({ isOpen, onClose, onReservationCreated }) => {
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: '',
    cost: '',
    contact: '',
    roomId: '',
    eventFrom: '',
    eventTo: '',
    reservationFrom: '',
    reservationTo: '',
    imageFile: null,
  });

  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  // Cargar las salas disponibles
  useEffect(() => {
    if (isOpen) {
      fetchRooms();
    }
  }, [isOpen]);

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const response = await axiosInstance.get('/rooms');
      setRooms(response.data || []);
    } catch (error) {
      console.error('Error al cargar las salas:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar las salas disponibles',
        icon: 'error',
        confirmButtonColor: '#3085d6',
      });
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleChange = e => {
    const { name, value, type, files } = e.target;

    if (type === 'file') {
      const file = files[0];
      setFormData({
        ...formData,
        [name]: file,
      });

      // Crear previsualización de la imagen
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    // Limpiar error del campo cuando se modifica
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const now = new Date();

    // Validación de campos requeridos
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.description.trim())
      newErrors.description = 'La descripción es requerida';
    if (formData.description.length > 5000)
      newErrors.description =
        'La descripción no puede exceder los 5000 caracteres';
    if (!formData.capacity) newErrors.capacity = 'La capacidad es requerida';
    if (parseInt(formData.capacity) <= 0)
      newErrors.capacity = 'La capacidad debe ser un número positivo';
    if (!formData.cost) newErrors.cost = 'El costo es requerido';
    if (!formData.contact.trim())
      newErrors.contact = 'El contacto es requerido';
    if (!formData.roomId) newErrors.roomId = 'Debe seleccionar un espacio';

    // Validación de fechas
    if (!formData.eventFrom)
      newErrors.eventFrom = 'La fecha de inicio del evento es requerida';
    if (!formData.eventTo)
      newErrors.eventTo = 'La fecha de fin del evento es requerida';
    if (!formData.reservationFrom)
      newErrors.reservationFrom = 'La fecha de inicio de reserva es requerida';
    if (!formData.reservationTo)
      newErrors.reservationTo = 'La fecha de fin de reserva es requerida';

    // Validación de lógica de fechas
    if (formData.eventFrom && formData.eventTo) {
      const eventFrom = new Date(formData.eventFrom);
      const eventTo = new Date(formData.eventTo);

      if (eventFrom >= eventTo) {
        newErrors.eventTo =
          'La fecha de fin debe ser posterior a la fecha de inicio';
      }
    }

    if (formData.reservationFrom && formData.reservationTo) {
      const reservationFrom = new Date(formData.reservationFrom);
      const reservationTo = new Date(formData.reservationTo);

      if (reservationFrom >= reservationTo) {
        newErrors.reservationTo =
          'La fecha de fin de reserva debe ser posterior a la fecha de inicio';
      }
    }

    // Validar que las fechas del evento estén dentro del rango de reserva
    if (
      formData.eventFrom &&
      formData.reservationFrom &&
      formData.reservationTo
    ) {
      const eventFrom = new Date(formData.eventFrom);
      const reservationFrom = new Date(formData.reservationFrom);
      const reservationTo = new Date(formData.reservationTo);

      if (eventFrom < reservationFrom || eventFrom > reservationTo) {
        newErrors.eventFrom =
          'El evento debe realizarse dentro del período de reserva';
      }
    }

    if (
      formData.eventTo &&
      formData.reservationFrom &&
      formData.reservationTo
    ) {
      const eventTo = new Date(formData.eventTo);
      const reservationFrom = new Date(formData.reservationFrom);
      const reservationTo = new Date(formData.reservationTo);

      if (eventTo < reservationFrom || eventTo > reservationTo) {
        newErrors.eventTo =
          'El evento debe realizarse dentro del período de reserva';
      }
    }

    // Validación de imagen obligatoria
    if (!formData.imageFile) {
      newErrors.imageFile = 'La imagen del evento es obligatoria';
    } else {
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
      ];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(formData.imageFile.type)) {
        newErrors.imageFile = 'Solo se permiten imágenes JPEG, JPG, PNG o GIF';
      }

      if (formData.imageFile.size > maxSize) {
        newErrors.imageFile = 'La imagen no debe exceder los 5MB';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Confirmación antes de crear
    const result = await Swal.fire({
      title: '¿Crear reserva?',
      text: '¿Estás seguro de crear esta nueva reserva?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, crear',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) {
      return;
    }

    setSubmitting(true);

    // Crear FormData para enviar la imagen
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('capacity', formData.capacity);
    data.append('cost', formData.cost);
    data.append('contact', formData.contact);
    data.append('roomId', formData.roomId);
    data.append('eventFrom', formData.eventFrom);
    data.append('eventTo', formData.eventTo);
    data.append('reservationFrom', formData.reservationFrom);
    data.append('reservationTo', formData.reservationTo);
    data.append('status', 'pending'); // Por defecto pendiente

    if (formData.imageFile) {
      data.append('imageFile', formData.imageFile);
    }

    try {
      await axiosInstance.post('/events', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Swal.fire({
        title: '¡Reserva creada!',
        text: 'La reserva ha sido creada exitosamente.',
        icon: 'success',
        confirmButtonColor: '#3085d6',
      });

      // Limpiar formulario y cerrar modal
      setFormData({
        name: '',
        description: '',
        capacity: '',
        cost: '',
        contact: '',
        roomId: '',
        eventFrom: '',
        eventTo: '',
        reservationFrom: '',
        reservationTo: '',
        imageFile: null,
      });
      setImagePreview(null);

      // Notificar al componente padre para refrescar
      if (onReservationCreated) {
        onReservationCreated();
      }

      onClose();
    } catch (error) {
      console.error('Error al crear la reserva:', error);

      let errorMessage = 'Hubo un error al crear la reserva';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#d33',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // Confirmar si hay datos sin guardar
    const hasData = Object.values(formData).some(
      value => value && (typeof value !== 'object' || value instanceof File)
    );

    if (hasData) {
      Swal.fire({
        title: '¿Descartar cambios?',
        text: 'Tienes datos sin guardar. ¿Seguro que quieres cerrar?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, descartar',
        cancelButtonText: 'Cancelar',
      }).then(result => {
        if (result.isConfirmed) {
          setImagePreview(null);
          onClose();
        }
      });
    } else {
      setImagePreview(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              Crear Nueva Reserva
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              &times;
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna Izquierda */}
            <div className="space-y-4">
              {/* Nombre del Evento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaFileAlt className="inline mr-2 text-blue-500" />
                  Nombre del Evento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ingrese el nombre del evento"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaFileAlt className="inline mr-2 text-blue-500" />
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describa el evento"
                />
                <div className="flex justify-between mt-1">
                  {errors.description ? (
                    <p className="text-sm text-red-600">{errors.description}</p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {formData.description.length}/5000 caracteres
                    </p>
                  )}
                </div>
              </div>

              {/* Espacio (Room) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaMapPin className="inline mr-2 text-blue-500" />
                  Espacio <span className="text-red-500">*</span>
                </label>
                <select
                  name="roomId"
                  value={formData.roomId}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                    errors.roomId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loadingRooms}
                >
                  <option value="">Seleccione un espacio</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
                {loadingRooms && (
                  <p className="mt-1 text-sm text-gray-500">
                    Cargando espacios...
                  </p>
                )}
                {errors.roomId && (
                  <p className="mt-1 text-sm text-red-600">{errors.roomId}</p>
                )}
              </div>

              {/* Información de Contacto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaUser className="inline mr-2 text-blue-500" />
                  Información de Contacto{' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                    errors.contact ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Información para contactar al organizador"
                />
                {errors.contact && (
                  <p className="mt-1 text-sm text-red-600">{errors.contact}</p>
                )}
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-4">
              {/* Capacidad y Costo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaUsers className="inline mr-2 text-blue-500" />
                    Capacidad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    min="1"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                      errors.capacity ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ej: 100"
                  />
                  {errors.capacity && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.capacity}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaDollarSign className="inline mr-2 text-blue-500" />
                    Costo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="cost"
                    value={formData.cost}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                      errors.cost ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ej: $1000 o Gratis"
                  />
                  {errors.cost && (
                    <p className="mt-1 text-sm text-red-600">{errors.cost}</p>
                  )}
                </div>
              </div>

              {/* Fechas del Evento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaCalendarAlt className="inline mr-2 text-blue-500" />
                  Fechas del Evento <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Inicio
                    </label>
                    <input
                      type="datetime-local"
                      name="eventFrom"
                      value={formData.eventFrom}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                        errors.eventFrom ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.eventFrom && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.eventFrom}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Fin
                    </label>
                    <input
                      type="datetime-local"
                      name="eventTo"
                      value={formData.eventTo}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                        errors.eventTo ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.eventTo && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.eventTo}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Fechas de Reserva */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaCalendarAlt className="inline mr-2 text-blue-500" />
                  Fechas de Reserva <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Inicio
                    </label>
                    <input
                      type="datetime-local"
                      name="reservationFrom"
                      value={formData.reservationFrom}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                        errors.reservationFrom
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                    />
                    {errors.reservationFrom && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.reservationFrom}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Fin
                    </label>
                    <input
                      type="datetime-local"
                      name="reservationTo"
                      value={formData.reservationTo}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                        errors.reservationTo
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                    />
                    {errors.reservationTo && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.reservationTo}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Imagen Obligatoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaFileImage className="inline mr-2 text-blue-500" />
                  Imagen del Evento <span className="text-red-500">*</span>
                </label>

                {/* Previsualización de imagen */}
                {imagePreview && (
                  <div className="mb-3">
                    <img
                      src={imagePreview}
                      alt="Previsualización"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                    />
                  </div>
                )}

                <input
                  type="file"
                  name="imageFile"
                  onChange={handleChange}
                  accept="image/*"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                    errors.imageFile ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.imageFile && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.imageFile}
                  </p>
                )}
                {formData.imageFile ? (
                  <div className="mt-2 text-sm">
                    <p className="text-green-600">
                      ✓ Archivo seleccionado: {formData.imageFile.name}
                    </p>
                    <p className="text-gray-500">
                      Tamaño:{' '}
                      {(formData.imageFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-yellow-600">
                    ⚠ Por favor selecciona una imagen (requerido)
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Formatos permitidos: JPEG, JPG, PNG, GIF. Tamaño máximo: 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creando...
                </>
              ) : (
                'Crear Reserva'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReservationModal;

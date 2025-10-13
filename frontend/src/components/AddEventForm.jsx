// src/components/AddEventForm.jsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig';

const AddEventForm = ({ onEventCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: '',
    cost: '',
    contact: '',
    eventFrom: '',
    eventTo: '',
    reservationFrom: '',
    reservationTo: '',
    roomId: '',
  });
  const [imageFile, setImageFile] = useState(null); // Estado para la imagen
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({}); // Estado para manejar errores de validación
  const [rooms, setRooms] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado para manejar el envío

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

    // Limpiar errores al modificar el campo
    setErrors({ ...errors, [name]: '' });
    setError('');
  };

  const handleImageChange = e => {
    const file = e.target.files[0];
    setImageFile(file);
    // Optional: Implement previsualización si lo deseas
  };

  const validate = () => {
    const newErrors = {};
    const now = new Date();

    const eventFromDate = new Date(formData.eventFrom);
    const eventToDate = new Date(formData.eventTo);
    const reservationFromDate = new Date(formData.reservationFrom);
    const reservationToDate = new Date(formData.reservationTo);

    // Validar Nombre
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del evento es requerido.';
    }

    // Validar Fecha de Inicio del Evento
    if (!formData.eventFrom) {
      newErrors.eventFrom =
        'La fecha y hora de inicio del evento son requeridas.';
    } else if (eventFromDate < now) {
      newErrors.eventFrom =
        'La fecha y hora de inicio del evento no pueden estar en el pasado.';
    }

    // Validar Fecha de Fin del Evento
    if (!formData.eventTo) {
      newErrors.eventTo = 'La fecha y hora de fin del evento son requeridas.';
    } else if (eventToDate <= eventFromDate) {
      newErrors.eventTo =
        'La fecha y hora de fin del evento deben ser posteriores a la de inicio.';
    }

    // Validar Fecha de Inicio de la Reserva
    if (!formData.reservationFrom) {
      newErrors.reservationFrom =
        'La fecha y hora de inicio de la reserva son requeridas.';
    } else if (reservationFromDate > eventFromDate) {
      newErrors.reservationFrom =
        'La fecha y hora de inicio de la reserva no pueden ser posteriores al inicio del evento.';
    }

    // Validar Fecha de Fin de la Reserva
    if (!formData.reservationTo) {
      newErrors.reservationTo =
        'La fecha y hora de fin de la reserva son requeridas.';
    } else if (reservationToDate < eventToDate) {
      newErrors.reservationTo =
        'La fecha y hora de fin de la reserva no pueden ser anteriores al fin del evento.';
    }

    // Validar que la Reserva esté dentro del Período del Evento
    if (
      formData.eventFrom &&
      formData.eventTo &&
      formData.reservationFrom &&
      formData.reservationTo
    ) {
      if (reservationFromDate > eventFromDate) {
        newErrors.reservationFrom =
          'La reserva no puede iniciar después del inicio del evento.';
      }
      if (reservationToDate < eventToDate) {
        newErrors.reservationTo =
          'La reserva no puede finalizar antes del fin del evento.';
      }
    }

    // Validar Sala Seleccionada
    if (!formData.roomId) {
      newErrors.roomId = 'Selecciona un espacio para el evento.';
    }

    setErrors(newErrors);

    // Retornar si hay errores
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true); // Iniciar indicador de carga

    // Limpiar errores previos
    setErrors({});
    setError('');

    if (validate()) {
      const data = new FormData();
      // Agregar los campos del formulario al FormData
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      // Agregar el archivo de imagen
      if (imageFile) {
        data.append('imageFile', imageFile); // Nombre consistente con el backend
      }

      try {
        const response = await axiosInstance.post('/events', data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log('Evento creado:', response.data);
        // Llamar a la función `onEventCreated` y pasarle los datos del evento
        onEventCreated(response.data);
        // Opcional: Resetear el formulario después de la creación exitosa
        setFormData({
          name: '',
          description: '',
          capacity: '',
          cost: '',
          contact: '',
          eventFrom: '',
          eventTo: '',
          reservationFrom: '',
          reservationTo: '',
          roomId: '',
        });
        setImageFile(null);
        setError('');
      } catch (error) {
        console.error('Error creating event:', error);
        const errorMessage =
          error.response?.data?.error ||
          error.response?.data?.errors?.join(', ') ||
          'Error al crear el evento. Por favor, intente nuevamente.';
        setError(errorMessage);
      } finally {
        setIsSubmitting(false); // Finalizar indicador de carga
      }
    } else {
      setError('Por favor, corrige los errores en el formulario.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="my-8">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Solicitar Reserva
      </h2>
      {error && (
        <p className="text-red-500 mb-4 text-center bg-red-100 p-2 rounded">
          {error}
        </p>
      )}
      <form
        onSubmit={handleSubmit}
        className="space-y-6"
        encType="multipart/form-data"
      >
        {/* Sala y Espacio */}
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Espacio</h3>
          {/* Sala */}
          <div className="mb-4">
            <label
              htmlFor="roomId"
              className="block text-gray-700 font-medium mb-2"
            >
              Selecciona un Espacio
            </label>
            <select
              name="roomId"
              id="roomId"
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.roomId ? 'border-red-500' : 'border-gray-300'
              }`}
              value={formData.roomId}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona un espacio</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
            {errors.roomId && (
              <p className="text-red-500 text-sm mt-1">{errors.roomId}</p>
            )}
          </div>
        </div>
        {/* Información Básica */}
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">
            Información Básica
          </h3>

          {/* Nombre del Evento */}
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-gray-700 font-medium mb-2"
            >
              Nombre del Evento
            </label>
            <input
              type="text"
              name="name"
              id="name"
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              value={formData.name}
              onChange={handleChange}
              required
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>
          {/* Descripción */}
          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-gray-700 font-medium mb-2"
            >
              Descripción
            </label>
            <textarea
              name="description"
              id="description"
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              value={formData.description}
              onChange={handleChange}
              rows="4"
            ></textarea>
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>
          {/* Capacidad y Costo */}
          <div className="flex flex-wrap -mx-2">
            <div className="w-full md:w-1/2 px-2 mb-4 md:mb-0">
              <label
                htmlFor="capacity"
                className="block text-gray-700 font-medium mb-2"
              >
                Capacidad
              </label>
              <input
                type="number"
                name="capacity"
                id="capacity"
                className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.capacity ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formData.capacity}
                onChange={handleChange}
                required
                min="1"
              />
              {errors.capacity && (
                <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>
              )}
            </div>
            <div className="w-full md:w-1/2 px-2">
              <label
                htmlFor="cost"
                className="block text-gray-700 font-medium mb-2"
              >
                Costo
              </label>
              <input
                type="text"
                name="cost"
                id="cost"
                className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.cost ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formData.cost}
                onChange={handleChange}
                required
                placeholder="Ejemplo: $1000"
              />
              {errors.cost && (
                <p className="text-red-500 text-sm mt-1">{errors.cost}</p>
              )}
            </div>
          </div>
          {/* Contacto */}
          <div className="mt-4">
            <label
              htmlFor="contact"
              className="block text-gray-700 font-medium mb-2"
            >
              Información de Contacto
            </label>
            <input
              type="text"
              name="contact"
              id="contact"
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.contact ? 'border-red-500' : 'border-gray-300'
              }`}
              value={formData.contact}
              onChange={handleChange}
              required
              placeholder="Ejemplo: Juan Pérez, 555-1234"
            />
            {errors.contact && (
              <p className="text-red-500 text-sm mt-1">{errors.contact}</p>
            )}
          </div>
        </div>

        {/* Fechas */}
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Fechas</h3>
          <div className="flex flex-wrap -mx-2">
            {/* Fecha de Inicio del Evento */}
            <div className="w-full md:w-1/2 px-2 mb-4">
              <label
                htmlFor="eventFrom"
                className="block text-gray-700 font-medium mb-2"
              >
                Inicio del Evento
              </label>
              <input
                type="datetime-local"
                name="eventFrom"
                id="eventFrom"
                className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.eventFrom ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formData.eventFrom}
                onChange={handleChange}
                required
              />
              {errors.eventFrom && (
                <p className="text-red-500 text-sm mt-1">{errors.eventFrom}</p>
              )}
            </div>
            {/* Fecha de Fin del Evento */}
            <div className="w-full md:w-1/2 px-2 mb-4">
              <label
                htmlFor="eventTo"
                className="block text-gray-700 font-medium mb-2"
              >
                Fin del Evento
              </label>
              <input
                type="datetime-local"
                name="eventTo"
                id="eventTo"
                className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.eventTo ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formData.eventTo}
                onChange={handleChange}
                required
              />
              {errors.eventTo && (
                <p className="text-red-500 text-sm mt-1">{errors.eventTo}</p>
              )}
            </div>
            {/* Inicio de la Reserva */}
            <div className="w-full md:w-1/2 px-2">
              <label
                htmlFor="reservationFrom"
                className="block text-gray-700 font-medium mb-2"
              >
                Inicio de la Reserva
              </label>
              <input
                type="datetime-local"
                name="reservationFrom"
                id="reservationFrom"
                className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.reservationFrom ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formData.reservationFrom}
                onChange={handleChange}
                required
              />
              {errors.reservationFrom && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.reservationFrom}
                </p>
              )}
            </div>
            {/* Fin de la Reserva */}
            <div className="w-full md:w-1/2 px-2">
              <label
                htmlFor="reservationTo"
                className="block text-gray-700 font-medium mb-2"
              >
                Fin de la Reserva
              </label>
              <input
                type="datetime-local"
                name="reservationTo"
                id="reservationTo"
                className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.reservationTo ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formData.reservationTo}
                onChange={handleChange}
                required
              />
              {errors.reservationTo && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.reservationTo}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Imagen del Evento */}
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">
            Imagen del Evento
          </h3>
          <div className="mb-4">
            <label
              htmlFor="imageFile"
              className="block text-gray-700 font-medium mb-2"
            >
              Imagen del Evento
            </label>
            <input
              type="file"
              name="imageFile" // Nombre consistente con el backend
              id="imageFile"
              accept="image/*"
              onChange={handleImageChange}
              className={`w-full border ${
                errors.imageFile ? 'border-red-500' : 'border-gray-300'
              } rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              required // Opcional: Haz que este campo sea obligatorio
            />
            {errors.imageFile && (
              <p className="text-red-500 text-sm mt-1">{errors.imageFile}</p>
            )}
          </div>
          {/* Previsualización de la Imagen */}
          {imageFile && (
            <div className="mt-4">
              <p className="text-gray-700 font-medium mb-2">
                Previsualización de la Imagen:
              </p>
              <img
                src={URL.createObjectURL(imageFile)}
                alt="Previsualización"
                className="w-32 h-32 object-cover rounded"
              />
            </div>
          )}
        </div>

        {/* Mensaje de Error General */}
        {errors.submit && (
          <p className="text-red-500 text-sm text-center">{errors.submit}</p>
        )}

        {/* Botón de Envío */}
        <div className="text-center">
          <button
            type="submit"
            className={`bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded shadow-md transition duration-200 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isSubmitting} // Deshabilitar el botón mientras se envía
          >
            {isSubmitting ? 'Creando...' : 'Crear Reserva'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEventForm;

// src/components/UpdateRoomForm.jsx (versión mejorada con imagen)
import { useState } from 'react';
//import axiosInstance from '../axiosConfig';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { updateRoom as updateRoomThunk } from '../features/rooms/roomsSlice';

const UpdateRoomForm = ({ room, onRoomSaved, onClose }) => {
  const [formData, setFormData] = useState({ ...room });
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageChange = e => {
    setImageFile(e.target.files[0]);
  };

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

    setIsSubmitting(true);
    setError('');

    // Mostrar modal de confirmación
    const confirmResult = await Swal.fire({
      title: '¿Actualizar sala?',
      text: `¿Está seguro de que desea actualizar la sala "${room.name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar',
    });

    if (!confirmResult.isConfirmed) {
      setIsSubmitting(false);
      return;
    }

    // Mostrar modal de carga
    Swal.fire({
      title: 'Actualizando sala...',
      text: `Por favor espere mientras se actualiza "${room.name}"`,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      // Crear FormData si hay imagen, sino usar objeto normal
      let payload;
      let isFormData = false;

      if (imageFile) {
        isFormData = true;
        payload = new FormData();

        // Agregar todos los campos al FormData
        Object.keys(formData).forEach(key => {
          const value = formData[key];
          if (typeof value === 'boolean') {
            payload.append(key, value ? 'true' : 'false');
          } else {
            payload.append(key, value);
          }
        });

        // Agregar la imagen
        payload.append('image', imageFile);
      } else {
        payload = formData;
      }

      const response = await dispatch(
        updateRoomThunk({ id: room.id, data: payload })
      ).unwrap();

      // Cerrar modal de carga
      Swal.close();

      // Mostrar modal de éxito
      await Swal.fire({
        title: '¡Actualizada!',
        text: `La sala "${formData.name}" ha sido actualizada exitosamente.`,
        icon: 'success',
        confirmButtonColor: '#3085d6',
      });

      // Llamar a la función del padre para actualizar la lista y cerrar el modal
      onRoomSaved(response);
    } catch (error) {
      console.error('Error updating room:', error);

      // Cerrar modal de carga
      Swal.close();

      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.errors?.join(', ') ||
        'Error al actualizar la sala. Por favor, intente nuevamente.';

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

  const handleCancel = () => {
    if (isSubmitting) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: 'El proceso de actualización se cancelará y los cambios no guardados se perderán.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'Continuar editando',
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
        <h2 className="text-2xl font-bold text-gray-800">Actualizar Sala</h2>
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
        {/* Campos del formulario */}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">
            Nombre *
          </label>
          <input
            type="text"
            name="name"
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-2">
            Descripción *
          </label>
          <textarea
            name="description"
            rows="3"
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            value={formData.description}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-2">
            Capacidad *
          </label>
          <input
            type="number"
            name="capacity"
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            value={formData.capacity}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-2">
            Ubicación *
          </label>
          <input
            type="text"
            name="location"
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            value={formData.location}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Checkboxes para características */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isAccessible"
              id="isAccessible"
              checked={formData.isAccessible}
              onChange={handleChange}
              className="h-4 w-4"
              disabled={isSubmitting}
            />
            <label htmlFor="isAccessible" className="ml-2 text-sm">
              Accesible
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="hasInternet"
              id="hasInternet"
              checked={formData.hasInternet}
              onChange={handleChange}
              className="h-4 w-4"
              disabled={isSubmitting}
            />
            <label htmlFor="hasInternet" className="ml-2 text-sm">
              Tiene Internet
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="hasBathrooms"
              id="hasBathrooms"
              checked={formData.hasBathrooms}
              onChange={handleChange}
              className="h-4 w-4"
              disabled={isSubmitting}
            />
            <label htmlFor="hasBathrooms" className="ml-2 text-sm">
              Tiene Baños
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="hasAudioEquipment"
              id="hasAudioEquipment"
              checked={formData.hasAudioEquipment}
              onChange={handleChange}
              className="h-4 w-4"
              disabled={isSubmitting}
            />
            <label htmlFor="hasAudioEquipment" className="ml-2 text-sm">
              Equipo de Audio
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="hasVideoEquipment"
              id="hasVideoEquipment"
              checked={formData.hasVideoEquipment}
              onChange={handleChange}
              className="h-4 w-4"
              disabled={isSubmitting}
            />
            <label htmlFor="hasVideoEquipment" className="ml-2 text-sm">
              Equipo de Video
            </label>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-2">
            ¿Ubicado en la Ciudad Universitaria de Caracas? *
          </label>
          <select
            name="isInCUC"
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            value={formData.isInCUC}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          >
            <option value={true}>Sí</option>
            <option value={false}>No</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-2">
            Encargado *
          </label>
          <input
            type="text"
            name="staffowner"
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            value={formData.staffowner}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Campo para subir imagen */}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">
            Imagen del Espacio
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          />
          {room.imagePath && (
            <p className="text-sm text-gray-500 mt-1">
              Imagen actual: {room.imagePath.split('/').pop()}
            </p>
          )}
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
                Actualizando...
              </>
            ) : (
              'Actualizar Sala'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateRoomForm;

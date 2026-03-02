// src/components/RequestUpgradeForm.jsx
import React, { useState } from 'react';
import axiosInstance from '../axiosConfig';

const RequestUpgradeForm = ({ onClose, onSuccess }) => {
  // Agregar onSuccess como prop
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleFileChange = e => {
    setFile(e.target.files[0]);
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!file) {
      setError('Por favor, sube un documento que te certifique.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('certificationDocument', file);

    try {
      await axiosInstance.post('/users/request-upgrade', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccessMessage(
        '¡Solicitud enviada con éxito! Recibirás una notificación cuando sea revisada.'
      );

      // esperar un momento para mostrar el mensaje de éxito y luego ejecutar onSuccess
      setTimeout(() => {
        onSuccess(); // actualizar el estado del padre
      }, 2000);
    } catch (err) {
      console.error('Error al solicitar el ascenso de rol:', err);

      const errorData = err.response?.data;

      if (errorData?.error?.includes('no requiere esta solicitud')) {
        setError('Ya se está procesando tu solicitud');
        // Si ya tiene una solicitud en proceso, también podemos actualizar el estado
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setError(
          errorData?.message ||
            errorData?.error ||
            'Error al procesar la solicitud. Intente más tarde.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4 text-center text-blue-700">
        Solicitud para Reservar Espacios
      </h2>
      <p className="mb-6 text-gray-700 text-center">
        Es necesario que subas un documento (Cédula, carné, constancia) que
        certifique que eres parte de la comunidad universitaria. Tu solicitud
        será revisada por un administrador.
      </p>

      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

      {successMessage ? (
        <div className="text-center p-4 bg-green-100 border border-green-400 text-green-700 rounded mb-4">
          <p className="font-semibold">{successMessage}</p>
          <p className="text-sm mt-2">Cerrando ventana...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-4">
            <label className="block font-semibold text-gray-800 mb-2">
              Subir Documento de Certificación
            </label>
            <input
              type="file"
              name="certificationDocument"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              className="w-full border p-2 rounded-lg file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0 file:text-sm file:font-semibold
                         file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Formatos permitidos: PDF, JPG, PNG.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-green-400"
              disabled={loading || !file}
            >
              {loading ? 'Enviando...' : 'Solicitar Acceso'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RequestUpgradeForm;

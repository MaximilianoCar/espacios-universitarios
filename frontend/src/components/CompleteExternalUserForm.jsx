import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../axiosConfig';
import Swal from '../utils/swal';
import {
  FaIdCard,
  FaFileUpload,
  FaUserTie,
  FaUniversity,
  FaBriefcase,
  FaTimes,
  FaChevronLeft,
  FaInfoCircle,
} from 'react-icons/fa';

const CompleteExternalUserForm = ({ onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    isCompanyRepresentative: false,
    companyName: '',
    companyRif: '',
    certificationPath: null,
    ciFile: null,
  });
  const [errors, setErrors] = useState({});
  const [filePreview, setFilePreview] = useState(null);

  // Referencia para el contenedor scrolleable
  const scrollContainerRef = useRef(null);
  const submitButtonRef = useRef(null);

  // Efecto para hacer scroll cuando se muestran campos de empresa
  useEffect(() => {
    if (formData.isCompanyRepresentative && scrollContainerRef.current) {
      // Pequeño delay para que se rendericen los campos
      setTimeout(() => {
        if (submitButtonRef.current) {
          submitButtonRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
          });
        }
      }, 100);
    }
  }, [formData.isCompanyRepresentative]);

  const handleChange = e => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked,
      });

      if (name === 'isCompanyRepresentative' && !checked) {
        setFormData(prev => ({
          ...prev,
          companyName: '',
          companyRif: '',
        }));

        // Limpiar errores de empresa
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.companyName;
          delete newErrors.companyRif;
          return newErrors;
        });
      }
    } else if (type === 'file') {
      const file = files[0];
      setFormData({
        ...formData,
        [name]: file,
      });

      if (file) {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => setFilePreview(reader.result);
          reader.readAsDataURL(file);
        } else {
          setFilePreview('document');
        }
      } else {
        setFilePreview(null);
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validar origen (companyName ahora es el origen)
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'El origen/procedencia es requerido';
    } else if (formData.companyName.length > 200) {
      newErrors.companyName = 'El origen no puede exceder 200 caracteres';
    }

    if (formData.isCompanyRepresentative) {
      if (!formData.companyRif.trim()) {
        newErrors.companyRif = 'El RIF de la empresa es requerido';
      } else if (formData.companyRif.length > 20) {
        newErrors.companyRif = 'El RIF no puede exceder 20 caracteres';
      }
    }

    if (!formData.ciFile) {
      newErrors.ciFile = 'Debe subir un documento de cédula de identidad';
    } else if (formData.ciFile.size > 5 * 1024 * 1024) {
      newErrors.ciFile = 'El archivo no debe exceder 5MB';
    } else if (
      !['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(
        formData.ciFile.type
      )
    ) {
      newErrors.ciFile = 'Solo se permiten archivos JPG, PNG o PDF';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) {
      // Encontrar el primer campo con error y hacer scroll
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(
        `[name="${firstErrorField}"]`
      );

      Swal.fire({
        title: 'Error',
        text: 'Por favor corrige los errores en el formulario',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });

      if (errorElement) {
        setTimeout(() => {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorElement.focus();
          errorElement.classList.add(
            'ring-2',
            'ring-red-500',
            'ring-opacity-50'
          );
          setTimeout(() => {
            errorElement.classList.remove(
              'ring-2',
              'ring-red-500',
              'ring-opacity-50'
            );
          }, 3000);
        }, 100);
      }
      return;
    }

    setSubmitting(true);

    const data = new FormData();
    data.append('origin', formData.companyName); // Usamos companyName como origin
    data.append('isCompanyRepresentative', formData.isCompanyRepresentative);

    if (formData.isCompanyRepresentative) {
      data.append('companyName', formData.companyName);
      data.append('companyRif', formData.companyRif);
    } else {
      data.append('companyName', formData.companyName);
    }

    if (formData.ciFile) {
      data.append('certification', formData.ciFile);
    }

    try {
      const response = await axiosInstance.post(
        '/users/complete-external',
        data,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      Swal.fire({
        title: '¡Completado!',
        text: 'Tu información ha sido actualizada exitosamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (error) {
      console.error('Error al completar información:', error);
      Swal.fire({
        title: 'Error',
        text:
          error.response?.data?.error || 'Error al completar la información',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Función para remover el archivo
  const handleRemoveFile = () => {
    setFormData({ ...formData, ciFile: null });
    setFilePreview(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header fijo */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 -ml-1"
              disabled={submitting}
            >
              <FaChevronLeft className="text-xl" />
            </button>
            <h2 className="text-lg sm:text-xl font-bold text-center flex-1">
              Completar información
            </h2>
            <div className="w-8"></div> {/* Espacio para equilibrar */}
          </div>
          <p className="text-xs sm:text-sm text-blue-100 text-center mt-1">
            Usuario externo - Datos adicionales requeridos
          </p>
        </div>

        {/* Contenedor scrolleable con ref */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
        >
          <form
            id="external-user-form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Información importante */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg">
              <div className="flex items-start">
                <FaInfoCircle className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-blue-800">
                  Complete su información para poder utilizar el sistema de
                  reservas. Los campos marcados con{' '}
                  <span className="text-red-500 font-bold">*</span> son
                  obligatorios.
                </p>
              </div>
            </div>

            {/* Origen/Procedencia */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                <FaUniversity className="inline mr-2 text-blue-600" />
                ¿De dónde viene? <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Ej: Empresa XYZ, Otra Universidad, Organización ABC, etc.
              </p>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className={`w-full px-4 py-3 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                  errors.companyName
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
                placeholder="Ej: Empresa Tecnológica ABC S.A."
                maxLength={200}
              />
              {errors.companyName && (
                <p className="mt-2 text-sm text-red-600 flex items-start">
                  <span className="mr-1">•</span> {errors.companyName}
                </p>
              )}
            </div>

            {/* ¿Representa empresa? */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start mb-3">
                <input
                  type="checkbox"
                  name="isCompanyRepresentative"
                  id="isCompanyRepresentative"
                  checked={formData.isCompanyRepresentative}
                  onChange={handleChange}
                  className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 mt-0.5 flex-shrink-0"
                />
                <label
                  htmlFor="isCompanyRepresentative"
                  className="ml-3 block text-sm font-medium text-gray-700"
                >
                  <div className="flex items-center mb-1">
                    <FaUserTie className="mr-2 text-green-600 text-sm flex-shrink-0" />
                    <span>
                      ¿Viene en representación de una empresa/organización?
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-normal block">
                    Marque esta opción si representa una organización formal
                  </span>
                </label>
              </div>

              {/* Campos condicionales si representa empresa */}
              {formData.isCompanyRepresentative && (
                <div className="mt-4 pt-3 border-t border-gray-200 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaBriefcase className="inline mr-2 text-blue-600" />
                      RIF de la empresa <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="companyRif"
                      value={formData.companyRif}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                        errors.companyRif
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-300'
                      }`}
                      placeholder="Ej: J-12345678-9"
                      maxLength={20}
                    />
                    {errors.companyRif && (
                      <p className="mt-2 text-sm text-red-600 flex items-start">
                        <span className="mr-1">•</span> {errors.companyRif}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Documento de cédula */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                <FaIdCard className="inline mr-2 text-blue-600" />
                Documento de cédula de identidad{' '}
                <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Suba una copia de su cédula de identidad (imagen o PDF) (Máximo
                2MB)
              </p>

              {/* Previsualización */}
              <div className="mb-4">
                {filePreview ? (
                  filePreview === 'document' ? (
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center flex-1 min-w-0">
                        <FaFileUpload className="text-xl text-blue-500 mr-3 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-blue-700 font-medium truncate">
                            {formData.ciFile?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Archivo PDF listo para subir
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="text-red-500 hover:text-red-700 p-2 flex-shrink-0 ml-2"
                        title="Remover archivo"
                      >
                        <FaTimes className="text-lg" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="w-12 h-12 mr-3 bg-white border border-gray-300 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                          <img
                            src={filePreview}
                            alt="Preview de cédula"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-green-700 font-medium truncate">
                            {formData.ciFile?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Imagen cargada
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="text-red-500 hover:text-red-700 text-sm flex items-center flex-shrink-0 ml-2"
                      >
                        <FaTimes className="mr-1" /> Remover
                      </button>
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <div className="text-center">
                      <FaFileUpload className="text-3xl text-gray-400 mb-2 mx-auto" />
                      <p className="text-sm text-gray-500">
                        Sin archivo seleccionado
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar archivo:
                </label>
                <input
                  type="file"
                  name="ciFile"
                  onChange={handleChange}
                  accept=".jpg,.jpeg,.png,.pdf"
                  className={`w-full px-4 py-3 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${
                    errors.ciFile
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                />
              </div>

              {errors.ciFile && (
                <p className="mt-2 text-sm text-red-600 flex items-start">
                  <span className="mr-1">•</span> {errors.ciFile}
                </p>
              )}

              <p className="text-xs text-gray-500 mt-3">
                Formatos aceptados: JPG, PNG, PDF. Tamaño máximo: 5MB
              </p>
            </div>

            {/* Espaciador invisible para mejor scroll */}
            <div className="h-2"></div>
          </form>
        </div>

        {/* Footer fijo con botones */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 text-sm font-medium border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors order-2 sm:order-1"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              ref={submitButtonRef}
              type="submit"
              form="external-user-form"
              disabled={submitting}
              className="w-full sm:flex-1 px-6 py-3 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center order-1 sm:order-2"
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
                  <span>Procesando...</span>
                </>
              ) : (
                'Completar Información'
              )}
            </button>
          </div>
          <p className="text-xs text-center text-gray-500 mt-3">
            <span className="text-red-500">*</span> Todos los campos marcados
            son obligatorios
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompleteExternalUserForm;

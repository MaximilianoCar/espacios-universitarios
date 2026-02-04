import React, { useState } from 'react';
import axiosInstance from '../axiosConfig';
import Swal from '../utils/swal';
import {
  FaBuilding,
  FaIdCard,
  FaFileUpload,
  FaUserTie,
  FaUniversity,
  FaBriefcase,
  FaTimes,
} from 'react-icons/fa';

const CompleteExternalUserForm = ({ onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    isCompanyRepresentative: false,
    companyName: '',
    companyRif: '',
    certificationPath: null,
    ciFile: null,
    //origin: '',
  });
  const [errors, setErrors] = useState({});
  const [filePreview, setFilePreview] = useState(null);

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

    if (formData.isCompanyRepresentative) {
      if (!formData.companyName.trim()) {
        newErrors.companyName = 'El nombre de la empresa es requerido';
      } else if (formData.companyName.length > 100) {
        newErrors.companyName = 'El nombre no puede exceder 100 caracteres';
      }

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
      Swal.fire({
        title: 'Error',
        text: 'Por favor corrige los errores en el formulario',
        icon: 'error',
      });
      return;
    }

    setSubmitting(true);

    const data = new FormData();
    data.append('isCompanyRepresentative', formData.isCompanyRepresentative);

    if (formData.isCompanyRepresentative) {
      data.append('companyName', formData.companyName);
      data.append('origin', formData.companyName);
      data.append('companyRif', formData.companyRif);
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
    <div className="flex flex-col">
      {/* Solo en móvil: estructura con scroll completo */}
      <div className="hidden sm:block">
        {/* Desktop: modal compacto sin scroll */}
        <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Complete su información como usuario externo
            </h2>
            <p className="text-gray-600">
              Como usuario externo a la universidad, necesitamos algunos datos
              adicionales
            </p>
          </div>

          {/* Contenido con scroll solo si es necesario */}
          <div className="flex-1 overflow-y-auto pr-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Origen/Procedencia */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  <FaUniversity className="inline mr-2 text-blue-600" />
                  ¿De dónde viene? <span className="text-red-500">*</span>
                  <span className="text-sm font-normal text-gray-500 block mt-1">
                    (Ej: Empresa XYZ, Otra Universidad, Organización ABC, etc.)
                  </span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                    errors.companyName
                      ? 'border-red-500 ring-1 ring-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Ej: Empresa Tecnológica ABC S.A."
                  maxLength={200}
                />
                {errors.companyName && (
                  <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                    {errors.companyName}
                  </p>
                )}
              </div>

              {/* ¿Representa empresa? */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    name="isCompanyRepresentative"
                    id="isCompanyRepresentative"
                    checked={formData.isCompanyRepresentative}
                    onChange={handleChange}
                    className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                  <label
                    htmlFor="isCompanyRepresentative"
                    className="ml-3 block text-sm font-medium text-gray-700 flex items-center"
                  >
                    <FaUserTie className="mr-2 text-green-600" />
                    ¿Viene en representación de una empresa/organización?
                  </label>
                </div>

                {/* Campos condicionales si representa empresa */}
                {formData.isCompanyRepresentative && (
                  <div className="space-y-4 mt-4 pl-4 border-l-2 border-blue-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaBriefcase className="inline mr-2 text-blue-600" />
                        RIF de la empresa{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="companyRif"
                        value={formData.companyRif}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                          errors.companyRif
                            ? 'border-red-500 ring-1 ring-red-500'
                            : 'border-gray-300'
                        }`}
                        placeholder="Ej: J-12345678-9"
                        maxLength={20}
                      />
                      {errors.companyRif && (
                        <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                          {errors.companyRif}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Documento de cédula */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  <FaIdCard className="inline mr-2 text-blue-600" />
                  Documento de cédula de identidad{' '}
                  <span className="text-red-500">*</span>
                  <span className="text-sm font-normal text-gray-500 block mt-1">
                    Suba una copia de su cédula de identidad (imagen o PDF)
                  </span>
                </label>

                {/* Previsualización compacta */}
                <div className="mb-4">
                  {filePreview ? (
                    filePreview === 'document' ? (
                      <div className="flex items-center justify-between p-3 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                        <div className="flex items-center">
                          <FaFileUpload className="text-2xl text-blue-500 mr-3" />
                          <div>
                            <p className="text-sm text-blue-700 font-medium truncate max-w-xs">
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
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remover archivo"
                        >
                          <FaTimes className="text-lg" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 border-2 border-dashed border-green-300 rounded-lg bg-green-50">
                        <div className="flex items-center">
                          <div className="w-12 h-12 mr-3 bg-white border border-gray-300 rounded flex items-center justify-center">
                            <img
                              src={filePreview}
                              alt="Preview de cédula"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <div>
                            <p className="text-sm text-green-700 font-medium truncate max-w-xs">
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
                          className="text-red-500 hover:text-red-700 text-sm flex items-center"
                        >
                          <FaTimes className="mr-1" /> Remover
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                      <div className="text-center">
                        <FaFileUpload className="text-3xl text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">
                          Sin archivo seleccionado
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seleccionar archivo:
                  </label>
                  <input
                    type="file"
                    name="ciFile"
                    onChange={handleChange}
                    accept=".jpg,.jpeg,.png,.pdf"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${
                      errors.ciFile
                        ? 'border-red-500 ring-1 ring-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                </div>

                {errors.ciFile && (
                  <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                    {errors.ciFile}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Formatos aceptados: JPG, PNG, PDF. Máx. 5MB
                </p>
              </div>
            </form>
          </div>

          {/* Botones fuera del área de scroll */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    Procesando...
                  </>
                ) : (
                  'Completar Información'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Solo en móvil: estructura con scroll completo */}
      <div className="sm:hidden flex flex-col h-full">
        <div className="flex-shrink-0 p-4 border-b border-gray-200">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Complete su información como usuario externo
            </h2>
            <p className="text-sm text-gray-600">
              Como usuario externo a la universidad, necesitamos algunos datos
              adicionales
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Origen/Procedencia */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                <FaUniversity className="inline mr-1 text-blue-600 text-sm" />
                ¿De dónde viene? <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-gray-500 block mt-1">
                  (Ej: Empresa XYZ, Otra Universidad, Organización ABC, etc.)
                </span>
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                  errors.companyName
                    ? 'border-red-500 ring-1 ring-red-500'
                    : 'border-gray-300'
                }`}
                placeholder="Ej: Empresa Tecnológica ABC S.A."
                maxLength={200}
              />
              {errors.companyName && (
                <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                  {errors.companyName}
                </p>
              )}
            </div>

            {/* ¿Representa empresa? */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex items-start mb-3">
                <input
                  type="checkbox"
                  name="isCompanyRepresentative"
                  id="isCompanyRepresentative"
                  checked={formData.isCompanyRepresentative}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300 mt-1 flex-shrink-0"
                />
                <label
                  htmlFor="isCompanyRepresentative"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  <div className="flex items-center mb-1">
                    <FaUserTie className="mr-1 text-green-600 text-sm flex-shrink-0" />
                    ¿Viene en representación de una empresa/organización?
                  </div>
                  <span className="text-xs text-gray-500 font-normal">
                    Marque esta opción si representa una organización formal
                  </span>
                </label>
              </div>

              {/* Campos condicionales si representa empresa */}
              {formData.isCompanyRepresentative && (
                <div className="space-y-3 mt-3 pl-3 border-l-2 border-blue-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaBriefcase className="inline mr-1 text-blue-600 text-sm" />
                      RIF de la empresa <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="companyRif"
                      value={formData.companyRif}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                        errors.companyRif
                          ? 'border-red-500 ring-1 ring-red-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="Ej: J-12345678-9"
                      maxLength={20}
                    />
                    {errors.companyRif && (
                      <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                        {errors.companyRif}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Documento de cédula */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                <FaIdCard className="inline mr-1 text-blue-600 text-sm" />
                Documento de cédula de identidad{' '}
                <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-gray-500 block mt-1">
                  Suba una copia de su cédula de identidad (imagen o PDF)
                </span>
              </label>

              {/* Previsualización compacta */}
              <div className="mb-3">
                {filePreview ? (
                  filePreview === 'document' ? (
                    <div className="flex items-center justify-between p-2 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                      <div className="flex items-center flex-1 min-w-0">
                        <FaFileUpload className="text-lg text-blue-500 mr-2 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-blue-700 font-medium truncate">
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
                        className="text-red-500 hover:text-red-700 p-1 flex-shrink-0 ml-1"
                        title="Remover archivo"
                      >
                        <FaTimes className="text-base" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 border-2 border-dashed border-green-300 rounded-lg bg-green-50">
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="w-10 h-10 mr-2 bg-white border border-gray-300 rounded flex items-center justify-center flex-shrink-0">
                          <img
                            src={filePreview}
                            alt="Preview de cédula"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-green-700 font-medium truncate">
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
                        className="text-red-500 hover:text-red-700 text-xs flex items-center flex-shrink-0 ml-1"
                      >
                        <FaTimes className="mr-1" /> Remover
                      </button>
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <div className="text-center">
                      <FaFileUpload className="text-xl text-gray-400 mb-1" />
                      <p className="text-xs text-gray-500">
                        Sin archivo seleccionado
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seleccionar archivo:
                </label>
                <input
                  type="file"
                  name="ciFile"
                  onChange={handleChange}
                  accept=".jpg,.jpeg,.png,.pdf"
                  className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${
                    errors.ciFile
                      ? 'border-red-500 ring-1 ring-red-500'
                      : 'border-gray-300'
                  }`}
                />
              </div>

              {errors.ciFile && (
                <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                  {errors.ciFile}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Formatos aceptados: JPG, PNG, PDF. Máx. 5MB
              </p>
            </div>
          </form>
        </div>

        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex-1"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              onClick={handleSubmit}
              className="px-4 py-3 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed flex-1"
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
                  <span className="text-xs">Procesando...</span>
                </>
              ) : (
                'Completar Información'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteExternalUserForm;

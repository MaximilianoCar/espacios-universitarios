// src/components/CreateUserForm.jsx
import React, { useState } from 'react';
import axiosInstance from '../axiosConfig';
import Swal from '../utils/swal';
import { FaUniversity, FaUser, FaBuilding, FaInfoCircle } from 'react-icons/fa';

const CreateUserForm = ({ onUserCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    ci: '',
    role: 'visitor',
    isExternal: false,
    isCompanyRepresentative: false,
    companyName: '',
    companyRif: '',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompanyFields, setShowCompanyFields] = useState(false);

  // Definir traducciones de roles
  const ROLE_OPTIONS = [
    { value: 'visitor', label: 'Visitante Interno', internal: true },
    { value: 'externalvisitor', label: 'Visitante Externo', internal: false },
    { value: 'requester', label: 'Solicitante', internal: false },
    { value: 'coordinator', label: 'Coordinador', internal: false },
    { value: 'admin', label: 'Administrador', internal: false },
    { value: 'pending', label: 'Pendiente', internal: false },
  ];

  const handleChange = e => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      // Auto-ajustar isExternal según el rol seleccionado
      if (name === 'role') {
        if (value === 'externalvisitor') {
          newData.isExternal = true;
        } else if (value === 'visitor') {
          newData.isExternal = false;
        }
      }

      // Mostrar/ocultar campos de empresa
      if (name === 'isCompanyRepresentative') {
        setShowCompanyFields(checked);
      }

      return newData;
    });
  };

  // Manejar cambio de rol específico
  const handleRoleChange = e => {
    const { value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        role: value,
      };

      // Auto-ajustar isExternal según el rol
      if (value === 'externalvisitor') {
        newData.isExternal = true;
        newData.isCompanyRepresentative = false; // Resetear por defecto
        setShowCompanyFields(false);
      } else if (value === 'visitor') {
        newData.isExternal = false;
        newData.isCompanyRepresentative = false;
        setShowCompanyFields(false);
      } else {
        newData.isExternal = false;
        newData.isCompanyRepresentative = false;
        setShowCompanyFields(false);
      }

      return newData;
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validaciones adicionales
    if (
      formData.role === 'externalvisitor' &&
      formData.isCompanyRepresentative
    ) {
      if (!formData.companyName.trim() || !formData.companyRif.trim()) {
        Swal.fire({
          title: 'Error',
          text: 'Para usuarios que representan empresa, debe completar nombre y RIF de la empresa.',
          icon: 'error',
          confirmButtonColor: '#d33',
        });
        setIsSubmitting(false);
        return;
      }
    }

    // Preparar datos para enviar
    const dataToSend = {
      ...formData,
      companyName: formData.isCompanyRepresentative
        ? formData.companyName.trim()
        : null,
      companyRif: formData.isCompanyRepresentative
        ? formData.companyRif.trim()
        : null,
    };

    // Limpiar campos de empresa si no es representante
    if (!formData.isCompanyRepresentative) {
      dataToSend.companyName = null;
      dataToSend.companyRif = null;
    }

    try {
      await axiosInstance.post('/anyusers', dataToSend);

      // Mostrar modal de éxito con SweetAlert2
      Swal.fire({
        title: '¡Éxito!',
        text: 'Usuario creado exitosamente.',
        icon: 'success',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Aceptar',
        timer: 3000,
        timerProgressBar: true,
        didClose: () => {
          // Llamar a onUserCreated después de cerrar el modal
          onUserCreated();
        },
      });
    } catch (error) {
      console.error('Error creating user:', error);

      // Mostrar error con SweetAlert2
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.error || 'Error al crear el usuario.',
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Aceptar',
      });

      setError(error.response?.data?.error || 'Error al crear el usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determinar el tipo de usuario para mostrar información
  const getUserTypeInfo = () => {
    if (formData.role === 'externalvisitor') {
      if (formData.isCompanyRepresentative) {
        return {
          icon: <FaBuilding className="text-green-500" />,
          text: 'Representante de Empresa',
          color: 'text-green-700',
          bgColor: 'bg-green-50',
        };
      }
      return {
        icon: <FaUser className="text-purple-500" />,
        text: 'Visitante Externo',
        color: 'text-purple-700',
        bgColor: 'bg-purple-50',
      };
    }
    return {
      icon: <FaUniversity className="text-blue-500" />,
      text: 'Usuario Interno',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
    };
  };

  const userTypeInfo = getUserTypeInfo();

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Crear Nuevo Usuario</h3>
        <div
          className={`flex items-center px-3 py-1 rounded-full ${userTypeInfo.bgColor} ${userTypeInfo.color}`}
        >
          {userTypeInfo.icon}
          <span className="ml-2 text-sm font-semibold">
            {userTypeInfo.text}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2 font-medium">
              Nombre Completo *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-medium">
              Correo Electrónico *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: usuario@email.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2 font-medium">
              Contraseña *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-medium">
              CI (Cédula de Identidad)
            </label>
            <input
              type="text"
              name="ci"
              value={formData.ci}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Opcional"
            />
          </div>
        </div>

        {/* Rol y Tipo de Usuario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2 font-medium">
              Rol del Usuario *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleRoleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {ROLE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <FaInfoCircle className="mr-1" />
              {formData.role === 'externalvisitor'
                ? 'Usuarios externos a la institución'
                : formData.role === 'visitor'
                  ? 'Usuarios internos de la institución'
                  : 'Roles administrativos'}
            </p>
          </div>

          {/* Campo isExternal (auto-ajustado según rol) */}
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isExternal"
                checked={formData.isExternal}
                onChange={handleChange}
                disabled={
                  formData.role === 'externalvisitor' ||
                  formData.role === 'visitor'
                }
                className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-2"
              />
              <span className="text-gray-700 font-medium">
                ¿Es usuario externo?
              </span>
            </label>
            <FaInfoCircle
              className="ml-2 text-gray-400"
              title="Automáticamente ajustado según el rol seleccionado"
            />
          </div>
        </div>

        {/* Campos específicos para externalvisitor */}
        {formData.role === 'externalvisitor' && (
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">
              Información de Visitante Externo
            </h4>

            <div className="mb-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isCompanyRepresentative"
                  checked={formData.isCompanyRepresentative}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded mr-2"
                />
                <span className="text-gray-700 font-medium">
                  ¿Representa una empresa/organización?
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Marque si el usuario viene en representación de una empresa u
                organización externa
              </p>
            </div>

            {/* Campos de empresa si es representante */}
            {formData.isCompanyRepresentative && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">
                      Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      required={formData.isCompanyRepresentative}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Ej: Mi Empresa S.A."
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">
                      RIF de la Empresa *
                    </label>
                    <input
                      type="text"
                      name="companyRif"
                      value={formData.companyRif}
                      onChange={handleChange}
                      required={formData.isCompanyRepresentative}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Ej: J-12345678-9"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 flex items-center">
                  <FaInfoCircle className="mr-1" />
                  Estos campos son obligatorios cuando el usuario representa una
                  empresa
                </p>
              </div>
            )}
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 text-gray-800 px-5 py-2 rounded-lg hover:bg-gray-400 transition duration-150 font-medium disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition duration-150 font-medium"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
              </span>
            ) : (
              'Crear Usuario'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateUserForm;

// src/components/UpdateUserForm.jsx
import { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig';
import Swal from '../utils/swal';
import { FaUniversity, FaUser, FaBuilding, FaInfoCircle } from 'react-icons/fa';

const UpdateUserForm = ({ user, onUserUpdated }) => {
  const [formData, setFormData] = useState({
    role: user.role || 'visitor',
    name: user.name || '',
    email: user.email || '',
    ci: user.ci || '',
    status: user.status !== undefined ? user.status : true,
    isExternal: user.isExternal !== undefined ? user.isExternal : false,
    isCompanyRepresentative:
      user.isCompanyRepresentative !== undefined
        ? user.isCompanyRepresentative
        : false,
    companyName: user.companyName || '',
    companyRif: user.companyRif || '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompanyFields, setShowCompanyFields] = useState(
    formData.isCompanyRepresentative
  );

  // Definir traducciones de roles
  const ROLE_OPTIONS = [
    { value: 'visitor', label: 'Visitante Interno', internal: true },
    { value: 'externalvisitor', label: 'Visitante Externo', internal: false },
    { value: 'requester', label: 'Solicitante', internal: false },
    { value: 'coordinator', label: 'Coordinador', internal: false },
    { value: 'admin', label: 'Administrador', internal: false },
    { value: 'pending', label: 'Pendiente', internal: false },
  ];

  const ROLES_NO_EXTERNOS = ['coordinator', 'admin'];
  const ROLES_PUEDEN_SER_EXTERNOS = ['requester', 'pending'];

  const roleCannotBeExternal = role => {
    return ROLES_NO_EXTERNOS.includes(role) || role === 'visitor';
  };

  const canToggleExternalCheckbox = role => {
    return role === 'requester' || role === 'pending';
  };

  // Efecto para actualizar campos cuando cambia el rol
  useEffect(() => {
    if (formData.role === 'externalvisitor') {
      setFormData(prev => ({
        ...prev,
        isExternal: true,
      }));
    } else if (formData.role === 'visitor') {
      setFormData(prev => ({
        ...prev,
        isExternal: false,
      }));
    }
  }, [formData.role]);

  // Efecto para mostrar/ocultar campos de empresa
  useEffect(() => {
    setShowCompanyFields(
      formData.isExternal || formData.isCompanyRepresentative
    );
  }, [formData.isExternal, formData.isCompanyRepresentative]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;

    const normalizedValue =
      name === 'ci' && type !== 'checkbox' ? value.replace(/\D/g, '') : value;

    setFormData(prev => {
      if (name === 'isExternal' && checked && roleCannotBeExternal(prev.role)) {
        Swal.fire({
          title: 'Error',
          text: 'Los roles de Coordinador, Administrador y Visitante Interno no pueden ser usuarios externos.',
          icon: 'error',
          confirmButtonColor: '#d33',
        });
        return { ...prev };
      }

      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : normalizedValue,
      };

      if (name === 'isExternal' && !checked) {
        newData.isCompanyRepresentative = false;
        newData.companyName = '';
        newData.companyRif = '';
      } else if (name === 'isExternal' && checked) {
        newData.isCompanyRepresentative = true;
      }

      // Si se desmarca representante de empresa, limpiar campos
      if (name === 'isCompanyRepresentative' && !checked) {
        newData.companyName = '';
        newData.companyRif = '';
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
        newData.isCompanyRepresentative = true;
        // Mantener información de empresa si ya existía
        if (prev.role !== 'externalvisitor' && !prev.isExternal) {
          newData.companyName = '';
          newData.companyRif = '';
        }
      } else if (value === 'visitor') {
        newData.isExternal = false;
        newData.isCompanyRepresentative = false;
        newData.companyName = '';
        newData.companyRif = '';
      } else if (ROLES_NO_EXTERNOS.includes(value)) {
        newData.isExternal = false;
        newData.isCompanyRepresentative = false;
        newData.companyName = '';
        newData.companyRif = '';
      } else {
        if (newData.isExternal) {
          newData.isCompanyRepresentative = true;
        } else {
          newData.isCompanyRepresentative = false;
          newData.companyName = '';
          newData.companyRif = '';
        }
      }

      return newData;
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    if (formData.ci && !/^\d+$/.test(formData.ci)) {
      Swal.fire({
        title: 'Error',
        text: 'La cédula debe contener solo números.',
        icon: 'error',
        confirmButtonColor: '#d33',
      });
      setIsSubmitting(false);
      return;
    }

    if (roleCannotBeExternal(formData.role) && formData.isExternal) {
      Swal.fire({
        title: 'Error',
        text: 'Los roles de Coordinador, Administrador y Visitante Interno no pueden ser usuarios externos.',
        icon: 'error',
        confirmButtonColor: '#d33',
      });
      setIsSubmitting(false);
      return;
    }

    // Validaciones adicionales
    if (formData.isExternal) {
      if (!formData.companyName.trim() || !formData.companyRif.trim()) {
        Swal.fire({
          title: 'Error',
          text: 'Para usuarios externos, debe completar nombre y RIF de la empresa.',
          icon: 'error',
          confirmButtonColor: '#d33',
        });
        setIsSubmitting(false);
        return;
      }
    }

    // Preparar datos para enviar
    const dataToSend = {
      role: formData.role,
      name: formData.name,
      email: formData.email,
      ci: formData.ci || null,
      status: formData.status,
      isExternal: formData.isExternal,
      isCompanyRepresentative: formData.isExternal
        ? true
        : formData.isCompanyRepresentative,
      companyName: formData.isExternal ? formData.companyName.trim() : null,
      companyRif: formData.isExternal ? formData.companyRif.trim() : null,
    };

    try {
      await axiosInstance.put(`/users/${user.id}`, dataToSend);

      // Mostrar éxito con SweetAlert
      Swal.fire({
        title: '¡Éxito!',
        text: 'Usuario actualizado exitosamente.',
        icon: 'success',
        confirmButtonColor: '#3085d6',
        timer: 2000,
        timerProgressBar: true,
      }).then(() => {
        onUserUpdated({ ...user, ...formData });
      });
    } catch (error) {
      console.error('Error updating user:', error);

      // Mostrar error con SweetAlert
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.error || 'Error al actualizar el usuario.',
        icon: 'error',
        confirmButtonColor: '#d33',
      });

      setError(
        error.response?.data?.error || 'Error al actualizar el usuario.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determinar el tipo de usuario para mostrar información
  const getUserTypeInfo = () => {
    if (formData.isExternal) {
      if (formData.isCompanyRepresentative) {
        return {
          icon: <FaBuilding className="text-green-500" />,
          text:
            formData.role === 'externalvisitor'
              ? 'Representante de Empresa'
              : `${formData.role === 'requester' ? 'Solicitante' : 'Pendiente'} Externo - Representante`,
          color: 'text-green-700',
          bgColor: 'bg-green-50',
        };
      }
      return {
        icon: <FaUser className="text-purple-500" />,
        text:
          formData.role === 'externalvisitor'
            ? 'Visitante Externo'
            : `${formData.role === 'requester' ? 'Solicitante' : 'Pendiente'} Externo`,
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

  // Obtener texto descriptivo para el tipo de usuario
  const getUserTypeDescription = () => {
    if (formData.role === 'externalvisitor') {
      return 'Usuario externo a la institución (seleccionado automáticamente al elegir "Visitante Externo")';
    } else if (formData.role === 'visitor') {
      return 'Usuario interno de la institución (seleccionado automáticamente al elegir "Visitante Interno")';
    } else if (ROLES_NO_EXTERNOS.includes(formData.role)) {
      return 'Roles administrativos (solo internos)';
    } else if (ROLES_PUEDEN_SER_EXTERNOS.includes(formData.role)) {
      return 'Puede marcar o desmarcar si el usuario es externo a la institución';
    } else {
      return 'Usuario interno de la institución (roles administrativos)';
    }
  };

  const userTypeInfo = getUserTypeInfo();

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            Actualizar Usuario
          </h3>
          <p className="text-sm text-gray-600">ID: {user.id}</p>
        </div>
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

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-green-600">{success}</p>
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
              CI (Cédula de Identidad)
            </label>
            <input
              type="text"
              name="ci"
              value={formData.ci}
              onChange={handleChange}
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Opcional"
            />
          </div>

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
              {getUserTypeDescription()}
            </p>
          </div>
        </div>

        {/* Tipo de Usuario y Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isExternal"
                  checked={formData.isExternal}
                  onChange={handleChange}
                  disabled={
                    formData.role === 'externalvisitor' ||
                    !canToggleExternalCheckbox(formData.role)
                  }
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-2 disabled:cursor-not-allowed disabled:opacity-70"
                />
                <span className="text-gray-700 font-medium">
                  ¿Es usuario externo?
                </span>
              </label>
              <FaInfoCircle
                className="ml-2 text-gray-400 cursor-help"
                title={
                  roleCannotBeExternal(formData.role)
                    ? 'Este rol solo puede ser interno'
                    : formData.role === 'externalvisitor'
                      ? 'Automáticamente externo por ser visitante externo'
                      : canToggleExternalCheckbox(formData.role)
                        ? 'Puede marcar o desmarcar si el usuario es externo'
                        : 'No disponible para este rol'
                }
              />
            </div>
            <p className="text-xs text-gray-500 pl-6">
              {formData.isExternal
                ? formData.role === 'externalvisitor'
                  ? '✓ Usuario externo (determinado por el rol "Visitante Externo")'
                  : '✓ Usuario externo'
                : '✓ Usuario interno'}
            </p>

            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="status"
                  checked={formData.status}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-2"
                />
                <span className="text-gray-700 font-medium">
                  Usuario Activo
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Campos para usuarios externos */}
        {formData.isExternal && (
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">
              {formData.role === 'externalvisitor'
                ? 'Información de Visitante Externo'
                : `Información de ${formData.role === 'requester' ? 'Solicitante' : 'Pendiente'} Externo`}
            </h4>

            <div className="mb-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isCompanyRepresentative"
                  checked={true}
                  readOnly
                  disabled
                  className="h-4 w-4 text-green-600 border-gray-300 rounded mr-2"
                />
                <span className="text-gray-700 font-medium">
                  ¿Representa una empresa/organización?
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Para usuarios externos, este campo se marca automáticamente y
                debe completar los datos de la empresa
              </p>
            </div>

            {/* Campos de empresa si es representante */}
            {formData.isExternal && (
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
                      required={formData.isExternal}
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
                      required={formData.isExternal}
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
            onClick={() => onUserUpdated(user)}
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
                Guardando...
              </span>
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateUserForm;

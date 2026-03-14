// src/components/ForgotPasswordModal.js
import { useState } from 'react';
import axiosInstance from '../axiosConfig';
import SwalHelpers from '../utils/swal';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const ForgotPasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: email/ci, 2: código, 3: nueva contraseña
  const [formData, setFormData] = useState({
    email: '',
    ci: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!isOpen) return null;

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleRequestCode = async () => {
    if (!formData.email || !formData.ci) {
      setError('Por favor completa email y cédula.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await axiosInstance.post('/password-reset-request', {
        email: formData.email,
        ci: formData.ci,
      });

      SwalHelpers.success('Código enviado', 'Revisa tu correo electrónico.');
      setStep(2);
    } catch (error) {
      setError(
        error.response?.data?.error || 'No se pudo solicitar el código.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!formData.code) {
      setError('Por favor ingresa el código.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await axiosInstance.post('/password-reset-verify', {
        email: formData.email,
        code: formData.code,
      });

      setStep(3);
    } catch (error) {
      setError(error.response?.data?.error || 'Código inválido o expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Por favor completa ambos campos.');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await axiosInstance.post('/password-reset', {
        email: formData.email,
        code: formData.code,
        newPassword: formData.newPassword,
      });

      SwalHelpers.success(
        'Contraseña actualizada',
        'Tu contraseña ha sido cambiada correctamente.'
      );
      onSuccess();
      onClose();
    } catch (error) {
      setError(
        error.response?.data?.error || 'No se pudo cambiar la contraseña.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (step > 1) {
      SwalHelpers.fire({
        title: '¿Cancelar recuperación?',
        text: 'Si cancelas ahora, perderás el progreso.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'Continuar',
      }).then(result => {
        if (result.isConfirmed) {
          resetForm();
          onClose();
        }
      });
    } else {
      onClose();
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      email: '',
      ci: '',
      code: '',
      newPassword: '',
      confirmPassword: '',
    });
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Recuperar Contraseña
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Indicador de pasos */}
          <div className="flex justify-between mb-6 relative">
            {[1, 2, 3].map(num => (
              <div key={num} className="flex flex-col items-center z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center
                  ${
                    step >= num
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }
                  ${step === num ? 'ring-4 ring-blue-100' : ''}`}
                >
                  {num}
                </div>
                <span className="text-xs mt-1 text-gray-600">
                  {num === 1 ? 'Datos' : num === 2 ? 'Código' : 'Nueva'}
                </span>
              </div>
            ))}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 -z-10"></div>
            <div
              className="absolute top-4 left-4 h-0.5 bg-blue-600 transition-all duration-300 -z-10"
              style={{ width: `${(step - 1) * 50}%` }}
            ></div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Paso 1: Email y Cédula */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                Ingresa tu correo electrónico y cédula para recibir un código de
                verificación.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ejemplo@correo.com"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cédula *
                </label>
                <input
                  type="text"
                  name="ci"
                  value={formData.ci}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingresa tu cédula"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Paso 2: Código */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                Hemos enviado un código de verificación a{' '}
                <strong>{formData.email}</strong>. Revisa tu bandeja de entrada
                y escribe el código de 6 dígitos.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de Verificación *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-xl tracking-widest"
                  placeholder="000000"
                  maxLength="6"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  El código expira en 10 minutos
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setFormData(prev => ({ ...prev, code: '' }));
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
                disabled={isLoading}
              >
                ← Cambiar email
              </button>
            </div>
          )}

          {/* Paso 3: Nueva Contraseña */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                Crea una nueva contraseña para tu cuenta.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full pr-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Mínimo 6 caracteres"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(prev => !prev)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={
                      showNewPassword
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    }
                  >
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  La contraseña debe tener al menos 6 caracteres
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pr-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Repite la contraseña"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(prev => !prev)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={
                      showConfirmPassword
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    }
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="mt-8 flex space-x-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                disabled={isLoading}
              >
                Atrás
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (step === 1) handleRequestCode();
                else if (step === 2) handleVerifyCode();
                else handleResetPassword();
              }}
              disabled={isLoading}
              className={`flex-1 px-4 py-2 rounded-lg transition
                ${
                  isLoading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white font-medium`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
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
                  Procesando...
                </span>
              ) : step === 1 ? (
                'Enviar Código'
              ) : step === 2 ? (
                'Verificar Código'
              ) : (
                'Cambiar Contraseña'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;

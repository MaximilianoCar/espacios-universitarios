import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { login } from '../features/auth/authActions';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' });
    setErrorMessage('');
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido.';
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email.trim())
    ) {
      newErrors.email = 'El correo electrónico no es válido.';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = e => {
    e.preventDefault();

    if (validate()) {
      dispatch(login(formData.email, formData.password, navigate)).catch(
        error => {
          console.error('Error al iniciar sesión:', error);
          setErrorMessage(
            error.response?.data?.error ||
              'Error al iniciar sesión. Por favor, verifica tus credenciales e intenta nuevamente.'
          );
        }
      );
    } else {
      setErrorMessage('Por favor, corrige los errores en el formulario.');
    }
  };

  return (
    <>
      <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
        <Header />
        <div className="container mx-auto my-24 px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Inicio de Sesión
              </h2>
              <p className="text-gray-600">
                Registrate o inicia sesión para reservar espacios
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ejemplo@correo.com"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Ingresa tu contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition"
                      aria-label={
                        showPassword
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                      }
                    >
                      {showPassword ? (
                        <FaEyeSlash size={20} />
                      ) : (
                        <FaEye size={20} />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                >
                  Iniciar Sesión
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-center text-gray-600">
                  ¿No tienes una cuenta?{' '}
                  <a
                    href="/register"
                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    Regístrate aquí
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>

      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        onSuccess={() => {}}
      />
    </>
  );
};

export default LoginPage;

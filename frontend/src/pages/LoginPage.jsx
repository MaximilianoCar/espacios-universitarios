// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useDispatch } from 'react-redux';
import { login } from '../features/auth/authActions';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Para redirigir después del login

  const [showPassword, setShowPassword] = useState(false); // Estado para controlar la visibilidad de la contraseña
  const [errors, setErrors] = useState({}); // Estado para manejar errores de validación
  const [errorMessage, setErrorMessage] = useState(''); // Estado para manejar mensajes de error generales

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Limpiar el error al modificar el campo
    setErrors({ ...errors, [name]: '' });
    setErrorMessage('');
  };

  // Función de validación básica
  const validate = () => {
    const newErrors = {};

    // Validar Correo Electrónico
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido.';
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email.trim())
    ) {
      newErrors.email = 'El correo electrónico no es válido.';
    }

    // Validar Contraseña
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida.';
    }

    setErrors(newErrors);

    // Retornar si hay errores
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = e => {
    e.preventDefault();

    if (validate()) {
      dispatch(login(formData.email, formData.password, navigate))
        .then(() => {
          // Opcional: Puedes manejar acciones adicionales después del login exitoso
        })
        .catch(error => {
          // Manejar error del login
          console.error('Error al iniciar sesión:', error);
          setErrorMessage(
            error.response?.data?.error ||
              'Error al iniciar sesión. Por favor, verifica tus credenciales e intenta nuevamente.'
          );
        });
    } else {
      setErrorMessage('Por favor, corrige los errores en el formulario.');
    }
  };

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
      <Header />
      <div className="container mx-auto my-24">
        <h2 className="text-3xl font-bold mb-8 text-center">
          Inicio de Sesión
        </h2>
        {errorMessage && (
          <p className="text-red-500 mb-4 text-center">{errorMessage}</p>
        )}
        <form
          onSubmit={handleSubmit}
          className="max-w-md mx-auto bg-white p-6 rounded shadow"
        >
          {/* Email */}
          <div className="mb-4">
            <label htmlFor="email" className="block mb-1 font-semibold">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className={`w-full border p-2 rounded ${
                errors.email ? 'border-red-500' : ''
              }`}
              value={formData.email}
              onChange={handleChange}
              placeholder="ejemplo@correo.com"
              required
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="mb-4 relative">
            <label htmlFor="password" className="block mb-1 font-semibold">
              Contraseña
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              className={`w-full border p-2 rounded pr-10 ${
                errors.password ? 'border-red-500' : ''
              }`}
              value={formData.password}
              onChange={handleChange}
              placeholder="Ingresa tu contraseña"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              className="absolute top-9 right-3 text-gray-600 hover:text-gray-800 focus:outline-none"
              aria-label={
                showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
              }
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Iniciar Sesión
          </button>
          <p className="mt-4 text-center">
            ¿No tienes una cuenta?{' '}
            <a href="/register" className="text-blue-600 hover:underline">
              Regístrate
            </a>
          </p>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;
